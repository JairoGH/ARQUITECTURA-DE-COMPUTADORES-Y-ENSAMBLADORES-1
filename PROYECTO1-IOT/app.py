import paho.mqtt.client as mqtt
import ssl, random, time, json, subprocess, threading
from datetime import datetime, timezone
from gpiozero import LED, PWMLED, MotionSensor, Buzzer, DigitalOutputDevice, DigitalInputDevice, OutputDevice, AngularServo
import Adafruit_DHT

# ========= CONFIG MQTT =========
BROKER    = "28814b0b7e2f48dbadaec3d8fe175292.s1.eu.hivemq.cloud"
PORT      = 8883
USER      = "adminG3"
PASS      = "arquiG3_2025"
CLIENT_ID = f"sub-{random.randint(1000,9999)}"
KEEPALIVE = 60
TOPIC_ILUM   = "/ilumination"         # Topico de Iluminacion
TOPIC_IRR    = "/irrigation/status"   # Topico Estado De Bomba
TOPIC_ALERTS = "/alerts"              # Alertas en Web a Tiempo Real
TOPIC_ENTR   = "/entrance"            # Control del Porton
TOPIC_FAN   = "/ventilador"   # Control directo del ventilador
TOPIC_PUMP  = "/bomba_agua"   # Control directo de la bomba
TOPIC_ALARM = "/alarma"    # Control directo de la alarma (buzzer + RGB alternado)



# Handler MQTT global
mqtt_client = None


# ========= CONFIG MONGO =========
MONGO_URI  = "mongodb+srv://estuardovaquiax:qRX676MtLqktApQz@cluster0.1fjdylg.mongodb.net/"
DB_NAME    = "miBaseDeDatos"
COLL_NAME  = "ilumination"      # colección usada para luces
MOV_COLL   = "movimiento"       # PIR 
TEMP_COLL  = "temperatura"      # lecturas del DHT11
VENT_COLL  = "ventilacion"      # ventilación
SOIL_COLL  = "humedad_suelo"    # lecturas de suelo 
IRRIG_COLL = "riego_eventos"    # eventos de riego (ON/OFF)
ENTR_COLL  = "entrada_eventos"  # eventos de portón (apertura)
ALERTS_COLL = "alerts"          

def ejecutar_mongosh(comando: str) -> str:
    try:
        res = subprocess.run(
            ["mongosh", MONGO_URI, "--eval", comando, "--quiet"],
            capture_output=True, text=True, check=True
        )
        return res.stdout.strip()
    except subprocess.CalledProcessError as e:
        raise Exception(e.stderr.strip() or "Error ejecutando mongosh")

def guardar_evento(doc: dict, coleccion: str = COLL_NAME):
    doc_json = json.dumps(doc, ensure_ascii=False).replace("\\", "\\\\").replace("'", "\\'")
    comando = f"""
        use('{DB_NAME}');
        const doc = JSON.parse('{doc_json}');
        const r = db.{coleccion}.insertOne(doc);
        print(JSON.stringify({{ insertedId: r.insertedId }}));
    """
    try:
        out = ejecutar_mongosh(comando)
        if out:
            print(f"🗄 Guardado en MongoDB ({coleccion}) -> {out}")
    except Exception as e:
        print(f"  No se pudo guardar en MongoDB: {e}")

def utcnow_iso():
    return datetime.now(timezone.utc).isoformat()

# =============================== LOGICA LCD  ===========================
# Conexiones I2C: SDA->BCM2 (pin 3), SCL->BCM3 (pin 5)
lcd = None
try:
    
    from RPLCD.i2c import CharLCD
    
    lcd = CharLCD('PCF8574', address=0x27, port=1, cols=16, rows=2, charmap='A00')
except Exception:
    lcd = None
    print(" LCD no disponible (RPLCD no instalado o sin I2C). Continuando sin LCD.")

_lcd_msg_timer = None
_lcd_lock = threading.Lock()
_last_temp_text = ""

def lcd_write_lines(line1: str, line2: str | None = None):
    if not lcd: return
    with _lcd_lock:
        try:
            lcd.clear()
            lcd.write_string(line1[:16])
            if line2 is not None:
                lcd.crlf()
                lcd.write_string(line2[:16])
        except Exception as e:
            print(f"  LCD error: {e}")

def lcd_show_temp(temp_c: float, hum: float):
    text = f"T:{temp_c:4.1f}C H:{hum:4.1f}%"
    global _last_temp_text
    _last_temp_text = text
    if not lcd: return
    with _lcd_lock:
        try:
            lcd.home()
            lcd.write_string(text[:16].ljust(16))
        except Exception as e:
            print(f" LCD error: {e}")

def lcd_show_message(line2: str, duration_sec: int = 4):
    if not lcd: return
    global _lcd_msg_timer
    with _lcd_lock:
        try:
            lcd.home()
            lcd.write_string(_last_temp_text[:16].ljust(16))
            lcd.crlf()
            lcd.write_string(line2[:16].ljust(16))
        except Exception as e:
            print(f" LCD error: {e}")
        if _lcd_msg_timer:
            try: _lcd_msg_timer.cancel()
            except Exception: pass
        _lcd_msg_timer = threading.Timer(duration_sec, _lcd_clear_line2)
        _lcd_msg_timer.daemon = True
        _lcd_msg_timer.start()

def _lcd_clear_line2():
    if not lcd: return
    with _lcd_lock:
        try:
            lcd.home()
            lcd.write_string(_last_temp_text[:16].ljust(16))
            lcd.crlf()
            lcd.write_string("".ljust(16))
        except Exception as e:
            print(f"  LCD error: {e}")

# =========================== LOGICA ILUMINACION ===========================
# ========= CONFIG GPIO =========
ROOM_LEDS = {
    "sala":    LED(17),  # Físico 11
    "cuarto1": LED(27),  # Físico 13
    "cuarto2": LED(22),  # Físico 15
}

# =========================== RGB NORMAL ===========================
ACTIVE_HIGH = True
RGB = {
    "r": PWMLED(5,  active_high=ACTIVE_HIGH),   # Físico 29
    "g": PWMLED(6,  active_high=ACTIVE_HIGH),   # Físico 31
    "b": PWMLED(13, active_high=ACTIVE_HIGH),   # Físico 33
}
def rgb_off():
    RGB["r"].off(); RGB["g"].off(); RGB["b"].off()
def set_rgb_values(r: float, g: float, b: float):
    RGB["r"].value, RGB["g"].value, RGB["b"].value = r, g, b
def off_rgb():
    rgb_off()

# =========================== RGB ALARMA (ROJO/AZUL) ===========================
ALARM_ACTIVE_HIGH = ACTIVE_HIGH
ALARM_RGB = {
    "r": PWMLED(16, active_high=ALARM_ACTIVE_HIGH),  # GPIO16 (Físico 36)
    "g": PWMLED(20, active_high=ALARM_ACTIVE_HIGH),  # GPIO20 (Físico 38)
    "b": PWMLED(21, active_high=ALARM_ACTIVE_HIGH),  # GPIO21 (Físico 40)
}
def alarm_rgb_off():
    ALARM_RGB["r"].off(); ALARM_RGB["g"].off(); ALARM_RGB["b"].off()
_alarm_rgb_stop = threading.Event()
def _alarm_rgb_worker():
    toggle = False
    while not _alarm_rgb_stop.is_set():
        if toggle:
            # Alarma Activada ROJA
            ALARM_RGB["r"].on();  ALARM_RGB["g"].off(); ALARM_RGB["b"].off()
        else:
            # Alarma Activada AZUL
            ALARM_RGB["r"].off(); ALARM_RGB["g"].off(); ALARM_RGB["b"].on()
        toggle = not toggle
        _alarm_rgb_stop.wait(0.4)
    alarm_rgb_off()

# =============================== LOGICA PIR (HC-SR501) ===============================
PIR_GPIO = 4
# Configuración del sensor PIR
pir = MotionSensor(PIR_GPIO, queue_len=10, sample_rate=20, threshold=0.6)

PIR_WARMUP_SEC = 30
PIR_MIN_NO_MOTION_SEC = 0.8

_pir_ready_at = time.time() + PIR_WARMUP_SEC
_last_no_motion = time.time()

# =============================== LED EXTERIOR ===============================
OUTDOOR_LED = LED(18)  # GPIO18 (Físico 12)
OUTDOOR_OFF_DELAY_SEC = 5.0 # 5 segundos

outdoor_light_on = False
_outdoor_off_timer = None
pir_lock = threading.Lock()

def _cancel_off_timer():
    global _outdoor_off_timer
    if _outdoor_off_timer is not None:
        try:
            _outdoor_off_timer.cancel()
        except Exception:
            pass
        _outdoor_off_timer = None

def _outdoor_turn_off():
    global outdoor_light_on, _outdoor_off_timer
    with pir_lock:
        if pir.motion_detected:
            return
        if outdoor_light_on:
            OUTDOOR_LED.off()
            outdoor_light_on = False
            print("🌙 Patio: APAGADO por inactividad")
        _outdoor_off_timer = None

def _start_off_delay():
    global _outdoor_off_timer
    with pir_lock:
        _cancel_off_timer()
        _outdoor_off_timer = threading.Timer(OUTDOOR_OFF_DELAY_SEC, _outdoor_turn_off)
        _outdoor_off_timer.daemon = True
        _outdoor_off_timer.start()

def on_pir_motion_exterior():
    global outdoor_light_on, _last_no_motion
    now = time.time()
    if now < _pir_ready_at:
        return
    if (now - _last_no_motion) < PIR_MIN_NO_MOTION_SEC and not outdoor_light_on:
        return

    with pir_lock:
        if not outdoor_light_on:
            OUTDOOR_LED.on()
            outdoor_light_on = True
            now_iso = utcnow_iso()
            print(f"🌞 Patio: ENCENDIDO por movimiento [{now_iso}]")
            guardar_evento({
                "sensor": "PIR HCSR501",
                "accion": "MOVIMIENTO ON",
                "area": "Patio",
                "fechaHora": now_iso
            }, coleccion=MOV_COLL)
        _cancel_off_timer()

def on_pir_no_motion_exterior():
    global _last_no_motion
    _last_no_motion = time.time()
    print(" Patio: sin movimiento, iniciando temporizador de apagado…")
    _start_off_delay()

# =============================== LOGICA DHT11 ===============================
DHT_SENSOR = Adafruit_DHT.DHT11
DHT_PIN    = 14
DHT_PERIOD_SECONDS = 10

# ===============================  VENTILACIÓN / ALARMA  ===============================
BUZZER_PIN = 23
FAN_PIN    = 24
RELAY_ACTIVE_HIGH = True
buzzer = Buzzer(BUZZER_PIN, active_high=True)
fan    = DigitalOutputDevice(FAN_PIN, active_high=RELAY_ACTIVE_HIGH, initial_value=False)

# INTERVALOS DE ACTIVACION 
VENT_ON  = 27.0   # enciende ventilación
VENT_OFF = 25.0   # apaga ventilación
ALARM_ON  = 30.0  # enciende alarma
ALARM_OFF = 28.0  # apaga alarma

fan_manual_on   = False
fan_auto_on     = False

alarm_manual_on = False
alarm_auto_on   = False
alarm_lock   = threading.Lock()

# =============================== LOGICA DE RIEGO  ===============================
SOIL_D0_GPIO = 25
D0_IS_DRY_HIGH = True
PUMP_GPIO = 19
PUMP_ACTIVE_HIGH = True

# Sensor de humedad del suelo

SAMPLE_PERIOD = 0.02
SAMPLE_WINDOW = 0.5
DRY_THRESHOLD = 0.70
WET_THRESHOLD = 0.30
MIN_ON_SEC = 5
MIN_OFF_SEC = 5
IGNORE_AFTER_ON_SEC = 2
MAX_ON_SEC = 60
LOG_PERIOD_IRR = 0.5
SOIL_SAVE_PERIOD_SEC = 7 * 60

soil_d0 = DigitalInputDevice(SOIL_D0_GPIO, pull_up=False)
pump    = OutputDevice(PUMP_GPIO, active_high=PUMP_ACTIVE_HIGH, initial_value=False)

# =============================== LOGICA DE PORTÓN ==========================
SERVO_PIN = 12
servo = AngularServo(SERVO_PIN, min_angle=0, max_angle=90,
                     min_pulse_width=0.0005, max_pulse_width=0.0025)

def gate_open():
    try:
        servo.angle = 90
    except Exception as e:
        print(f"  Error moviendo servo (abrir): {e}")

def gate_close():
    try:
        servo.angle = 0
    except Exception as e:
        print(f"  Error moviendo servo (cerrar): {e}")

def handle_entrance(payload: dict, raw: str):
    action = (payload.get("action") or "").lower()
    now_ts = utcnow_iso()
    if action == "open":
        gate_open()
        print("🚪 Portón: ABRIENDO (90°)")
        lcd_show_message("Abriendo porton", duration_sec=4)
        guardar_evento({
            "evento": "gate_open",
            "fechaHora": now_ts,
            "source": "raspberrypi"
        }, coleccion=ENTR_COLL)
    elif action == "close":
        gate_close()
        print("🚪 Portón: CERRANDO (0°)")
        lcd_show_message("Cerrando porton", duration_sec=4)
    else:
        print(f" Acción de portón inválida: {action}")

def handle_fan_command(payload: dict, raw: str):
    global fan_manual_on
    action = (payload.get("action") or "").lower()
    now_ts = utcnow_iso()

    if action == "on":
        fan_manual_on = True
        sync_fan_hw()
        print("🌀 Ventilador: ON (manual)")
        lcd_show_message("Ventilador ON", duration_sec=3)
        guardar_evento({
            "topic": TOPIC_FAN, "evento": "vent_on_manual", "device": "ventilador",
            "action": "on", "payload": payload, "fechaHora": now_ts, "source": "raspberrypi"
        }, coleccion=VENT_COLL)

    elif action == "off":
        fan_manual_on = False
        sync_fan_hw()
        print("🌀 Ventilador: OFF (manual)")
        lcd_show_message("Ventilador OFF", duration_sec=3)
        guardar_evento({
            "topic": TOPIC_FAN, "evento": "vent_off_manual", "device": "ventilador",
            "action": "off", "payload": payload, "fechaHora": now_ts, "source": "raspberrypi"
        }, coleccion=VENT_COLL)

    else:
        print(f"  Acción inválida para ventilador: {action}")




def handle_pump_command(payload: dict, raw: str):
    """
    Espera JSON:
    { "device":"bomba_agua", "action":"on|off", "fecha":"DD-MM-YYYY", "hora":"HH:mm", "timestamp":"... GMT-6" }
    """
    action = (payload.get("action") or "").lower()
    now_ts = utcnow_iso()

    if action == "on":
        pump.on()
        print("💧 Bomba: ON (por tópico /bomba_agua)")
        lcd_show_message("Bomba ON", duration_sec=3)
        doc = {
            "topic": TOPIC_PUMP,
            "evento": "pump_on_manual",
            "device": "bomba_agua",
            "action": "on",
            "payload": payload,
            "fechaHora": now_ts,
            "source": "raspberrypi",
            "type": "pump_on_event"
        }
        guardar_evento(doc, coleccion=IRRIG_COLL)
        publish_irrigation_status("pump_on_manual", "manual", 100.0, raw=1)

    elif action == "off":
        pump.off()
        print("💧 Bomba: OFF (por tópico /bomba_agua)")
        lcd_show_message("Bomba OFF", duration_sec=3)
        doc = {
            "topic": TOPIC_PUMP,
            "evento": "pump_off_manual",
            "device": "bomba_agua",
            "action": "off",
            "payload": payload,
            "fechaHora": now_ts,
            "source": "raspberrypi",
            "type": "pump_off_event"
        }
        guardar_evento(doc, coleccion=IRRIG_COLL)
        publish_irrigation_status("pump_off_manual", "manual", 100.0, raw=0)

    else:
        print(f"  Acción inválida para bomba_agua: {action}")

def handle_alarm_command(payload: dict, raw: str):
    global alarm_manual_on
    action = (payload.get("action") or "").lower()
    now_ts = utcnow_iso()

    if action == "on":
        alarm_manual_on = True
        ensure_alarm_running()
        print("🚨 ALARMA: ON (manual)")
        lcd_show_message("ALERTA ON", duration_sec=4)
        manual_alert = {"type":"alarm_manual","evento":"alarm_on_manual","device":"alarma",
                        "action":"on","fechaHora":now_ts,"payload":payload,"source":"raspberrypi"}
        try:
            if mqtt_client: mqtt_client.publish(TOPIC_ALERTS, json.dumps(manual_alert), qos=0, retain=False)
        except Exception as e: print(f"  Error publicando alerta manual: {e}")
        guardar_evento(manual_alert, coleccion=ALERTS_COLL)

    elif action == "off":
        alarm_manual_on = False
        # Solo detenemos si además NO está prendida por automático
        if not alarm_auto_on:
            ensure_alarm_stopped()
        print("🔕 ALARMA: OFF (manual)")
        lcd_show_message("ALERTA OFF", duration_sec=4)
        manual_alert = {"type":"alarm_manual","evento":"alarm_off_manual","device":"alarma",
                        "action":"off","fechaHora":now_ts,"payload":payload,"source":"raspberrypi"}
        try:
            if mqtt_client: mqtt_client.publish(TOPIC_ALERTS, json.dumps(manual_alert), qos=0, retain=False)
        except Exception as e: print(f"  Error publicando alerta manual: {e}")
        guardar_evento(manual_alert, coleccion=ALERTS_COLL)

    else:
        print(f"  Acción inválida para alarma: {action}")





# ========= HELPERS MQTT/ALERTAS =========
def publish_irrigation_status(evento: str, state: str, estabilidad: float, raw: int):
    global mqtt_client
    payload = {
        "evento": evento,
        "state": state,
        "estabilidad": round(estabilidad, 1),
        "d0_raw": int(raw),
        "fechaHora": utcnow_iso(),
        "source": "raspberrypi"
    }
    try:
        if mqtt_client is not None:
            mqtt_client.publish(TOPIC_IRR, json.dumps(payload), qos=0, retain=False)
            print(f"📤 MQTT -> {TOPIC_IRR} {payload}")
        else:
            print("  MQTT client no inicializado; no se publicó estado de riego.")
    except Exception as e:
        print(f"  Error publicando MQTT riego: {e}")

def publish_alert(temp, hum, reason: str):
    
    global mqtt_client
    payload = {
        "type": "alarm_overheat",
        "reason": reason,
        "tempC": round(float(temp), 1),
        "humedad": round(float(hum), 1) if hum is not None else None,
        "fechaHora": utcnow_iso(),
        "source": "raspberrypi"
    }
    try:
        if mqtt_client:
            mqtt_client.publish(TOPIC_ALERTS, json.dumps(payload), qos=0, retain=False)
            print(f"📤 MQTT -> {TOPIC_ALERTS} {payload}")
    except Exception as e:
        print(f" Error publicando alerta MQTT: {e}")
    # Persistimos también
    try:
        guardar_evento({**payload, "canal": "mqtt_mirror"}, coleccion=ALERTS_COLL)
    except Exception as e:
        print(f" No se pudo guardar alerta en MongoDB: {e}")

# ========= HELPERS VENTILACIÓN/ALARMA =========
def guardar_evento_par_ventilacion(on_off: str, temp, hum, now_ts):
    
    guardar_evento({
        "evento": on_off, "sensor": "DHT11", "gpio": DHT_PIN,
        "tempC": round(float(temp), 1),
        "humedad": round(float(hum), 1) if hum is not None else None,
        "fan": "on" if on_off == "vent_on" else "off",
        "fechaHora": now_ts,
        "source": "raspberrypi"
    }, coleccion=VENT_COLL)

def activate_ventilation(temp, hum, now_ts):
    global fan_auto_on
    with alarm_lock:
        if fan_auto_on: return
        fan_auto_on = True
        sync_fan_hw()
        print(f" VENTILACIÓN ON (AUTO): {temp:.1f}°C (>= {VENT_ON}°C)")
        guardar_evento_par_ventilacion("vent_on", temp, hum, now_ts)

def deactivate_ventilation(temp, hum, now_ts):
    global fan_auto_on
    with alarm_lock:
        if not fan_auto_on: return
        fan_auto_on = False
        sync_fan_hw()
        print(f" VENTILACIÓN OFF (AUTO): {temp:.1f}°C (<= {VENT_OFF}°C)")
        guardar_evento_par_ventilacion("vent_off", temp, hum, now_ts)


def activate_alarm(temp, hum, now_ts):
    global alarm_auto_on
    with alarm_lock:
        if alarm_auto_on: return
        alarm_auto_on = True
        ensure_alarm_running()
        print(f"🚨 ALARMA ON (AUTO): {temp:.1f}°C (>= {ALARM_ON}°C)")
        alert_doc = {
            "type": "alarm_overheat",
            "evento": "alarm_on",
            "sensor": "DHT11",
            "gpio": DHT_PIN,
            "tempC": round(float(temp), 1),
            "humedad": round(float(hum), 1) if hum is not None else None,
            "buzzer": "on",
            "rgb_alarm": "red_blue_alt",
            "fechaHora": now_ts,
            "source": "raspberrypi"
        }
        guardar_evento(alert_doc, coleccion=ALERTS_COLL)
        publish_alert(temp, hum, reason="alarm_on")


def deactivate_alarm(temp, hum, now_ts):
    global alarm_auto_on
    with alarm_lock:
        if not alarm_auto_on: return
        alarm_auto_on = False
        # Solo detenemos si además NO está prendida por manual
        if not alarm_manual_on:
            ensure_alarm_stopped()
        print(f" ALARMA OFF (AUTO): {temp:.1f}°C (< {ALARM_OFF}°C)")
        alert_doc = {
            "type": "alarm_overheat",
            "evento": "alarm_off",
            "sensor": "DHT11",
            "gpio": DHT_PIN,
            "tempC": round(float(temp), 1),
            "humedad": round(float(hum), 1) if hum is not None else None,
            "buzzer": "off",
            "rgb_alarm": "off" if not alarm_manual_on else "manual_hold",
            "fechaHora": now_ts,
            "source": "raspberrypi"
        }
        guardar_evento(alert_doc, coleccion=ALERTS_COLL)
        publish_alert(temp, hum, reason="alarm_off")

def sync_fan_hw():
    """Ajusta el relé del ventilador según estados manual/auto."""
    if fan_manual_on or fan_auto_on:
        fan.on()
    else:
        fan.off()

def ensure_alarm_running():
    """Asegura buzzer + RGB en marcha (si hay alguna causa para estar ON)."""
    global _alarm_rgb_stop
    try:
        buzzer.beep(on_time=0.2, off_time=0.2, n=None, background=True)
    except Exception as e:
        print(f"  Buzzer error: {e}")
    if _alarm_rgb_stop.is_set():
        _alarm_rgb_stop.clear()
        threading.Thread(target=_alarm_rgb_worker, daemon=True).start()

def ensure_alarm_stopped():
    """Detiene buzzer + RGB si NO hay causas para estar ON."""
    global _alarm_rgb_stop
    try:
        buzzer.off()
    except Exception:
        pass
    _alarm_rgb_stop.set()
    alarm_rgb_off()


# ========= RGB helpers =========
def hex_to_rgb_floats(hex_color: str):
    hc = hex_color.strip().lstrip("#")
    if len(hc) != 6: raise ValueError("Color hex inválido; usa #RRGGBB")
    r = int(hc[0:2], 16) / 255.0
    g = int(hc[2:4], 16) / 255.0
    b = int(hc[4:6], 16) / 255.0
    return r, g, b

def _to01(x):
    v = float(x)
    if v > 1.0: v = v / 255.0
    return max(0.0, min(1.0, v))

def parse_rgb_from_payload(payload: dict):
    brightness = float(payload.get("brightness", 1.0))
    brightness = max(0.0, min(1.0, brightness))
    if "color" in payload and isinstance(payload["color"], str):
        r, g, b = hex_to_rgb_floats(payload["color"])
    elif all(k in payload for k in ("r","g","b")):
        r, g, b = _to01(payload["r"]), _to01(payload["g"]), _to01(payload["b"])
    else:
        raise ValueError("Faltan campos de color")
    return (r * brightness, g * brightness, b * brightness)

# ========= LÓGICA ILUMINACIÓN (MQTT) =========
def handle_ilumination(payload: dict, raw: str):
    device = (payload.get("device") or "").lower()
    action = (payload.get("action") or "").lower()
    msg_ts = payload.get("timestamp")
    now_ts = utcnow_iso()

    base_doc = {
        "topic": TOPIC_ILUM, "device": device, "action": action, "payload": payload,
        "receivedAt": now_ts, "timestampMsg": msg_ts, "source": "raspberrypi", "status": "executed",
    }

    if device == "led_room":
        room = (payload.get("room") or "").lower()
        led = ROOM_LEDS.get(room)
        if not led:
            print(f"  Room desconocido: {room}")
            base_doc.update({"status": "ignored", "reason": f"room_not_found:{room}"})
            guardar_evento(base_doc); return

        if action == "on":
            led.on();  print(f" {room}: ENCENDIDO")
            lcd_show_message(f"{room} ENCENDIDO", duration_sec=4)
        elif action == "off":
            led.off(); print(f" {room}: APAGADO")
            lcd_show_message(f"{room} APAGADO", duration_sec=3)
        else:
            print(f"  Acción inválida para led_room: {action}")
            base_doc.update({"status": "ignored", "reason": f"invalid_action:{action}"})
        base_doc["room"] = room
        guardar_evento(base_doc)

    elif device == "led_rgb":
        if (alarm_auto_on or alarm_manual_on):
            print("  RGB ignorado: alarma activa")
            base_doc.update({"status": "ignored", "reason": "alarm_active_rgb_locked"})
            guardar_evento(base_doc); return

        base_doc["deviceType"] = "rgb"
        if action in ("on","color","set"):
            try:
                if action == "on" and "color" not in payload and not all(k in payload for k in ("r","g","b")):
                    payload = {**payload, "color": "#ffffff"}
                r, g, b = parse_rgb_from_payload(payload)
                set_rgb_values(r, g, b)
                print(f" RGB -> r:{int(r*255)} g:{int(g*255)} b:{int(b*255)}")
                base_doc.update({"r": int(r*255), "g": int(g*255), "b": int(b*255)})
            except Exception as e:
                print(f"  RGB inválido: {e}")
                base_doc.update({"status": "ignored", "reason": f"invalid_rgb:{e}"})
        elif action == "off":
            off_rgb(); print(" RGB OFF")
        else:
            print(f"  Acción inválida para led_rgb: {action}")
            base_doc.update({"status": "ignored", "reason": f"invalid_action:{action}"})
        guardar_evento(base_doc)

    else:
        print(f"  Device no soportado: {device}")
        base_doc.update({"status": "ignored", "reason": f"unsupported_device:{device}"})
        guardar_evento(base_doc)

# ========= Conectar PIR =========
pir.when_motion = on_pir_motion_exterior
pir.when_no_motion = on_pir_no_motion_exterior

# ========= LECTURA DHT11 / GUARDADO =========
DHT_SAVE_EVERY = 300.0  # 5 minutos
def dht_worker():
    try:
        delay_first = DHT_PERIOD_SECONDS - (int(time.time()) % DHT_PERIOD_SECONDS)
        time.sleep(delay_first)
    except Exception:
        pass

    last_saved = 0.0

    while True:
        humedad, temp = Adafruit_DHT.read_retry(DHT_SENSOR, DHT_PIN, retries=3, delay_seconds=2)
        now_ts = utcnow_iso()
        now = time.time()

        if humedad is not None and temp is not None:
            temp = float(temp)
            humedad = float(humedad)

            # LCD: Línea 1 Temperatura y Humedad
            lcd_show_temp(temp, humedad)

            # === Ventilación (AUTOMÁTICO) ===
            if temp >= VENT_ON and not fan_auto_on:
                activate_ventilation(temp, humedad, now_ts)
            elif temp <= VENT_OFF and fan_auto_on:
                deactivate_ventilation(temp, humedad, now_ts)

            # === Alarma (AUTOMÁTICO) ===
            if temp >= ALARM_ON and not alarm_auto_on:
                activate_alarm(temp, humedad, now_ts)
            elif temp <= ALARM_OFF and alarm_auto_on:
                deactivate_alarm(temp, humedad, now_ts)

            # Log de lectura
            print(f" DHT11 -> {temp:.1f}°C, {humedad:.1f}%  [{now_ts}]")

            # Guardado periódico cada 5 minutos
            if (now - last_saved) >= DHT_SAVE_EVERY:
                guardar_evento({
                    "sensor": "DHT11",
                    "gpio": DHT_PIN,
                    "tempC": round(temp, 1),
                    "humedad": round(humedad, 1),
                    "fechaHora": now_ts,
                    "source": "raspberrypi",
                    "type": "reading"
                }, coleccion=TEMP_COLL)
                last_saved = now
        else:
            print(f" DHT11 lectura inválida [{now_ts}] (revisa cableado/alimentación)")

        time.sleep(DHT_PERIOD_SECONDS)


# ======================== LOGICA DE RIEGO =================================
def read_state_window():
    n = max(1, int(SAMPLE_WINDOW / SAMPLE_PERIOD))
    dry_count = 0; raw_last = 0
    for _ in range(n):
        raw = 1 if soil_d0.value else 0
        raw_last = raw
        is_dry = (raw == 1) if D0_IS_DRY_HIGH else (raw == 0)
        if is_dry: dry_count += 1
        time.sleep(SAMPLE_PERIOD)
    frac_dry = dry_count / n
    if frac_dry >= DRY_THRESHOLD:   return "dry", frac_dry, raw_last
    elif frac_dry <= WET_THRESHOLD: return "wet", frac_dry, raw_last
    else:                           return "unknown", frac_dry, raw_last

def label_state(state):
    return "SECO" if state == "dry" else ("HÚMEDO" if state == "wet" else "INDETERMINADO")

def irrigation_worker():
    bomba_on = False
    last_change = 0.0
    last_log = 0.0
    ignore_until = 0.0
    state_hold = "unknown"
    on_start_time = None
    last_saved = 0.0

    print(" Riego D0 (integrado) — iniciado")
    try:
        while True:
            state, frac_dry, raw = read_state_window()
            now = time.time()

            if state == "unknown":
                state_eff = state_hold if state_hold != "unknown" else ("dry" if bomba_on else "wet")
            else:
                state_eff = state
                state_hold = state

            if bomba_on:
                if on_start_time and (now - on_start_time) >= MAX_ON_SEC:
                    pump.off(); bomba_on = False; last_change = now
                    print(f"[SAFETY] Bomba OFF por MAX_ON_SEC ({MAX_ON_SEC}s)")
                    estabilidad = (frac_dry if state_eff=='dry' else 1-frac_dry) * 100.0
                    guardar_evento({
                        "evento": "pump_off_safety","state": state_eff,
                        "estabilidad": round(estabilidad, 1),
                        "d0_raw": raw, "fechaHora": utcnow_iso(), "source": "raspberrypi", "type": "pump_off_event"
                    }, coleccion=IRRIG_COLL)
                    publish_irrigation_status("pump_off_safety", state_eff, estabilidad, raw)
                else:
                    can_change = (now - last_change) >= MIN_ON_SEC
                    state_eff_for_off = "dry" if now < ignore_until else state_eff
                    if can_change and state_eff_for_off == "wet":
                        pump.off(); bomba_on = False; last_change = now
                        estabilidad = (frac_dry if state_eff=='dry' else 1-frac_dry) * 100.0
                        print(f"[ACCION] Bomba OFF (estado={label_state(state_eff)}, "
                              f"estabilidad={estabilidad:0.0f}% , raw={raw})")
                        guardar_evento({
                            "evento": "pump_off","state": state_eff,
                            "estabilidad": round(estabilidad, 1),
                            "d0_raw": raw, "fechaHora": utcnow_iso(), "source": "raspberrypi", "type": "pump_off_event"
                        }, coleccion=IRRIG_COLL)
                        publish_irrigation_status("pump_off", state_eff, estabilidad, raw)
            else:
                can_change = (now - last_change) >= MIN_OFF_SEC
                if can_change and state_eff == "dry":
                    pump.on(); bomba_on = True; last_change = now
                    ignore_until = now + IGNORE_AFTER_ON_SEC
                    on_start_time = now
                    estabilidad = frac_dry * 100.0
                    print(f"[ACCION] Bomba ON (estado={label_state(state_eff)}, "
                          f"estabilidad={estabilidad:0.0f}%, raw={raw})")
                    guardar_evento({
                        "evento": "BOMBA_ON","state": state_eff,
                        "estabilidad": round(estabilidad, 1),
                        "d0_raw": raw, "fechaHora": utcnow_iso(), "source": "raspberrypi", "type": "pump_on_event"
                    }, coleccion=IRRIG_COLL)
                    publish_irrigation_status("BOMBA_ON", state_eff, estabilidad, raw)

            if now - last_saved >= SOIL_SAVE_PERIOD_SEC:
                estabilidad = (frac_dry if state_eff == "dry" else (1 - frac_dry)) * 100.0
                guardar_evento({
                    "sensor": "Sensor_Humedad_Suelo",
                    "state": state_eff,
                    "estabilidad": round(estabilidad, 1),
                    "d0_raw": raw,
                    "fechaHora": utcnow_iso(), "source": "raspberrypi", "type": "reading"
                }, coleccion=SOIL_COLL)
                print(f"🗄 Lectura riego guardada: estado={label_state(state_eff)}, "
                      f"estabilidad={estabilidad:0.1f}%, raw={raw}")
                last_saved = now

            if (now - last_log) >= LOG_PERIOD_IRR:
                last_log = now

            time.sleep(0.01)

    except Exception as e:
        print("  Error en irrigation_worker:", e)
    finally:
        pump.off()
        print("Bomba OFF (salida segura)")

# =============================== MQTT CALLBACKS =================================
def on_connect(client, userdata, flags, rc, properties=None):
    if rc == 0:
        print(" Conectado a HiveMQ Cloud")
        client.subscribe(TOPIC_ILUM, qos=0)
        client.subscribe(TOPIC_ENTR, qos=0)
        client.subscribe(TOPIC_FAN,  qos=0)
        client.subscribe(TOPIC_PUMP, qos=0)
        client.subscribe(TOPIC_ALARM, qos=0)   
        print(f"📡 Escuchando en: {TOPIC_ILUM}, {TOPIC_ENTR}, {TOPIC_FAN}, {TOPIC_PUMP}, {TOPIC_ALARM}")
    else:
        print("❌ Error de conexión:", rc)



def on_message(client, userdata, msg):
    ts = time.strftime("%Y-%m-%d %H:%M:%S")
    raw = msg.payload.decode(errors="ignore")
    print(f"[{ts}] 📨 {msg.topic} -> {raw}")
    if msg.topic == TOPIC_ILUM:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            print("  Payload no es JSON válido")
            guardar_evento({
                "topic": msg.topic, "payloadRaw": raw, "receivedAt": utcnow_iso(),
                "source": "raspberrypi", "status": "invalid_json"
            })
            return
        handle_ilumination(data, raw)
    elif msg.topic == TOPIC_ENTR:
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            print("  Payload /entrance no es JSON válido")
            return
        handle_entrance(data, raw)
    elif msg.topic == TOPIC_FAN:     # <--- nuevo
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            print("  Payload /ventilador no es JSON válido")
            return
        handle_fan_command(data, raw)

    elif msg.topic == TOPIC_PUMP:    # <--- nuevo
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            print("  Payload /bomba_agua no es JSON válido")
            return
        handle_pump_command(data, raw)
    elif msg.topic == TOPIC_ALARM:   # <--- NUEVO
        try:
            data = json.loads(raw)
        except json.JSONDecodeError:
            print("  Payload /alarma no es JSON válido")
            return
        handle_alarm_command(data, raw)

    

# ================================= MAIN =================================
if __name__ == "__main__":   # <-- debe ser __name__ / __main__
    client = mqtt.Client(client_id=CLIENT_ID, protocol=mqtt.MQTTv311)
    client.username_pw_set(USER, PASS)
    client.tls_set(cert_reqs=ssl.CERT_REQUIRED)
    client.on_connect = on_connect
    client.on_message = on_message

    mqtt_client = client

    # Hilos
    threading.Thread(target=dht_worker, daemon=True).start()
    threading.Thread(target=irrigation_worker, daemon=True).start()

    print("🔌 Conectando al broker...")
    client.connect(BROKER, PORT, KEEPALIVE)
    client.loop_forever()

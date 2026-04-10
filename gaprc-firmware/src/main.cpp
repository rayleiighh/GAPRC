#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_PN532.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>
#include <Preferences.h>
#include <time.h>

// --- CONFIGURATION ---
const char* ssid = "Soul society";
const char* password = "Benlhajtaybi10";
const char* serverUrl = "http://192.168.0.139:3000/api/scan"; // Ton backend Node.js

// --- HARDWARE ---
#define SDA_PIN 21
#define SCL_PIN 22
#define BUZZER_PIN 23
unsigned long resetScreenTime = 0;
Adafruit_PN532 nfc(SDA_PIN, SCL_PIN);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

// --- OFFLINE STORAGE ---
Preferences nvs;

// --- DÉCLARATION DES FONCTIONS ---
void initNTP();
long getCurrentTimestamp();
void saveScanOffline(String uid, long timestamp);
void syncOfflineScans();
void displayMessage(String title, String msg);
void playReadTone();
void playSuccessTone();
void playErrorTone();

void setup() {
    Serial.begin(115200);
    pinMode(BUZZER_PIN, OUTPUT);
    Wire.begin(SDA_PIN, SCL_PIN);

    // Initialisation Écran
    display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
    display.clearDisplay();
    display.setTextColor(WHITE);
    displayMessage("Demarrage...", "GAPRC Kiosque");

    // Initialisation NFC
    nfc.begin();
    if (!nfc.getFirmwareVersion()) {
        Serial.println("❌ Lecteur NFC non trouvé !");
        displayMessage("Erreur", "Lecteur NFC HS");
        while (1);
    }
    nfc.SAMConfig();

    // Initialisation Wi-Fi
    WiFi.begin(ssid, password);
    Serial.print("Connexion Wi-Fi");
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
        delay(500);
        Serial.print(".");
        attempts++;
    }

    if (WiFi.status() == WL_CONNECTED) {
        Serial.println("\n✅ Wi-Fi connecté !");
        initNTP(); // On récupère l'heure mondiale
        syncOfflineScans(); // On vide la mémoire au cas où il y avait des pointages en attente
        displayMessage("Pret", "Passez votre badge");
    } else {
        Serial.println("\n⚠️ Démarrage HORS-LIGNE");
        displayMessage("Mode HORS-LIGNE", "Passez votre badge");
    }
}

void loop() {
    // 🔴 1. TIMER NON-BLOQUANT (Efface l'écran après 3s sans bloquer l'ESP32)
    if (resetScreenTime > 0 && millis() > resetScreenTime) {
        displayMessage(WiFi.status() == WL_CONNECTED ? "Pret" : "Mode HORS-LIGNE", "Passez votre badge");
        resetScreenTime = 0;
    }

    // 2. Vérification de la reconnexion Wi-Fi en tâche de fond (Background Sync)
    static unsigned long lastWifiCheck = 0;
    if (millis() - lastWifiCheck > 10000) { // Toutes les 10 secondes
        if (WiFi.status() == WL_CONNECTED) {
            syncOfflineScans();
        }
        lastWifiCheck = millis();
    }

    // 3. Lecture du badge NFC
    uint8_t success;
    uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
    uint8_t uidLength;

    success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 500);

    if (success) {
        playReadTone(); // 🔴 CA1 : Bip court immédiat de lecture physique

        String uidStr = "";
        for (uint8_t i = 0; i < uidLength; i++) {
            uidStr += String(uid[i], HEX);
        }
        
        long timestamp = getCurrentTimestamp();
        Serial.println("🎯 Badge détecté : " + uidStr + " à " + String(timestamp));
        displayMessage("Lecture...", "Traitement en cours");

        // 4. TENTATIVE D'ENVOI AU SERVEUR
        bool scanSent = false;
        if (WiFi.status() == WL_CONNECTED) {
            HTTPClient http;
            http.begin(serverUrl);
            http.addHeader("Content-Type", "application/json");

            // Formatage du JSON
            JsonDocument doc;
            doc["nfc_uid"] = uidStr;
            doc["timestamp"] = timestamp;
            String requestBody;
            serializeJson(doc, requestBody);

            int httpResponseCode = http.POST(requestBody);

            if (httpResponseCode == 200) {
                // Succès Online
                String responseStr = http.getString();
                JsonDocument respDoc;
                deserializeJson(respDoc, responseStr);
                String jobisteName = respDoc["jobiste_name"] | "Inconnu";
                String action = respDoc["action"] | "Check-in";
                
                playSuccessTone(); // 🔴 CA2 : Bip aigu de succès
                displayMessage("Succes (" + action + ")", "Bonjour " + jobisteName);
                scanSent = true;
            } else {
                playErrorTone(); // 🔴 CA3 : Bip grave d'erreur serveur
                Serial.println("❌ Erreur Serveur HTTP: " + String(httpResponseCode));
            }
            http.end();
        }

        // 5. FALLBACK : MODE HORS-LIGNE
        if (!scanSent) {
            playErrorTone(); // 🔴 Bip grave d'avertissement hors-ligne
            Serial.println("⚠️ Réseau/Serveur indisponible -> Sauvegarde NVS");
            saveScanOffline(uidStr, timestamp);
            displayMessage("Sauvegarde Locale", "Synchronisation differee");
        }

        // 🔴 CA4 : On arme le timer pour effacer l'écran dans 3 secondes
        // (On supprime complètement le delay(3000) et l'affichage bloquant)
        resetScreenTime = millis() + 3000; 
    }
}

// --- FONCTIONS UTILITAIRES ---

void initNTP() {
    configTime(3600, 3600, "pool.ntp.org"); // Fuseau horaire Belgique (GMT+1 + Heure d'été)
    struct tm timeinfo;
    if (!getLocalTime(&timeinfo)) {
        Serial.println("❌ Échec synchronisation NTP");
    } else {
        Serial.println("🕒 Heure synchronisée.");
    }
}

long getCurrentTimestamp() {
    time_t now;
    time(&now);
    return (long)now;
}

void saveScanOffline(String uid, long timestamp) {
    nvs.begin("gaprc", false); // "false" pour mode Lecture/Écriture
    int count = nvs.getInt("count", 0);
    
    // On stocke sous forme de String simple : "uid,timestamp"
    String data = uid + "," + String(timestamp);
    String key = "scan_" + String(count);
    
    nvs.putString(key.c_str(), data);
    nvs.putInt("count", count + 1);
    nvs.end();
    
    Serial.println("💾 Pointage stocké localement (Total attente : " + String(count + 1) + ")");
}

void syncOfflineScans() {
    nvs.begin("gaprc", false);
    int count = nvs.getInt("count", 0);
    
    if (count > 0 && WiFi.status() == WL_CONNECTED) {
        Serial.println("🔄 Début de synchronisation de " + String(count) + " pointages...");
        displayMessage("Synchronisation", String(count) + " pointages en cours...");
        
        int successCount = 0;
        HTTPClient http;

        for (int i = 0; i < count; i++) {
            String key = "scan_" + String(i);
            String data = nvs.getString(key.c_str(), "");
            
            if (data.length() > 0) {
                int commaIndex = data.indexOf(',');
                String uid = data.substring(0, commaIndex);
                long ts = data.substring(commaIndex + 1).toInt();

                http.begin(serverUrl);
                http.addHeader("Content-Type", "application/json");
                JsonDocument doc;
                doc["nfc_uid"] = uid;
                doc["timestamp"] = ts;
                String requestBody;
                serializeJson(doc, requestBody);

                int httpCode = http.POST(requestBody);
                if (httpCode == 200) {
                    successCount++;
                }
                http.end();
                delay(500); // Petite pause pour ne pas surcharger l'API Node.js
            }
        }

        if (successCount == count) {
            Serial.println("✅ Synchronisation réussie, purge de la mémoire !");
            nvs.clear(); // On vide le namespace
            nvs.putInt("count", 0);
            displayMessage("Synchro OK", "Memoire purgee");
        } else {
            Serial.println("⚠️ Échec partiel de la synchronisation.");
            displayMessage("Erreur Synchro", "Réessai plus tard");
        }
        delay(2000);
        displayMessage(WiFi.status() == WL_CONNECTED ? "Pret" : "Mode HORS-LIGNE", "Passez votre badge");
    }
    nvs.end();
}

void displayMessage(String title, String msg) {
    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextSize(1);
    display.println("--- " + title + " ---");
    display.setCursor(0, 20);
    display.setTextSize(1); // Mettre 2 si c'est trop petit, mais ça risque de déborder
    display.println(msg);
    display.display();
}

// --- FONCTIONS AUDIO ---
void playReadTone() {
    tone(BUZZER_PIN, 2500, 50); // Bip très court et aigu (Feedback tactile)
}

void playSuccessTone() {
    tone(BUZZER_PIN, 1000, 100);
    delay(100); // Petit delay toléré ici car c'est une animation sonore de validation
    tone(BUZZER_PIN, 2000, 200); // Accord montant = Validation
}

void playErrorTone() {
    tone(BUZZER_PIN, 300, 600); // Bip long et grave = Erreur / Refus / Hors-ligne
}
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_PN532.h>
#include <Wire.h>
#include <ArduinoJson.h>       // NOUVEAU : Pour lire la réponse du serveur
#include <Adafruit_GFX.h>      // NOUVEAU : Pour l'affichage OLED
#include <Adafruit_SSD1306.h>  // NOUVEAU : Pour l'affichage OLED

// Configuration Wi-Fi & Serveur
const char* ssid = "*************";
const char* password = "$$$$$$$$$$$";
const char* serverUrl = "http://$$$$$$$$$$:3000/badge"; 

// Configuration OLED (Largeur, Hauteur, Bus I2C, Pin Reset)
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

// Configuration NFC (Pins I2C par défaut de l'ESP32)
Adafruit_PN532 nfc(21, 22);

void setup() {
  Serial.begin(115200);

  // 1. Initialisation de l'OLED
  if(!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("Erreur allocation SSD1306"));
    for(;;); // On bloque si l'écran ne s'allume pas
  }
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 10);
  display.println("Demarrage...");
  display.display();
  
  // 2. Connexion au Wi-Fi
  Serial.print("Connexion au Wi-Fi");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { 
    delay(500); 
    Serial.print(".");
  }
  Serial.println("\nConnecté au Wi-Fi !");
  
  display.clearDisplay();
  display.setCursor(0, 10);
  display.println("WiFi OK !");
  display.display();
  
  // 3. Initialisation du NFC
  nfc.begin();
  nfc.SAMConfig();
  Serial.println("Prêt à badger !");

  // Écran d'accueil
  display.clearDisplay();
  display.setTextSize(2); // Texte plus gros
  display.setCursor(10, 20);
  display.println("BADGEZ !");
  display.display();
}

void loop() {
  uint8_t success;
  uint8_t uid[] = { 0, 0, 0, 0, 0, 0, 0 };
  uint8_t uidLength;

  success = nfc.readPassiveTargetID(PN532_MIFARE_ISO14443A, uid, &uidLength, 500);

  if (success) {
    String uidStr = "";
    for (uint8_t i = 0; i < uidLength; i++) {
      uidStr += String(uid[i], HEX);
    }
    
    Serial.println("\n--- Nouveau scan ---");
    Serial.println("UID lu : " + uidStr);

    // Affichage "Traitement..." sur l'OLED
    display.clearDisplay();
    display.setTextSize(1);
    display.setCursor(0, 20);
    display.println("Verification...");
    display.display();

    if(WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverUrl);
      http.addHeader("Content-Type", "application/json");

      String httpRequestData = "{\"nfc_uid\":\"" + uidStr + "\", \"station\":\"HALL_ENTREE\"}";
      int httpResponseCode = http.POST(httpRequestData);
      
      if (httpResponseCode > 0) {
        String payload = http.getString();
        Serial.println("Réponse du serveur : " + payload);

        // --- LA MAGIE ARDUINOJSON COMMENCE ICI ---
        StaticJsonDocument<200> doc;
        DeserializationError error = deserializeJson(doc, payload);

        display.clearDisplay(); // On efface pour afficher le résultat
        
        if (!error) {
          String status = doc["status"]; // On lit "known" ou "unknown"
          
          if (status == "known") {
            String user = doc["user"]; // On extrait "Rayane"
            
            // Affichage Succès !
            display.setTextSize(2);
            display.setCursor(0, 10);
            display.println("Bonjour");
            display.setCursor(0, 35);
            display.println(user); // Affiche "Rayane"
            
          } else {
            // Affichage Inconnu
            display.setTextSize(2);
            display.setCursor(10, 20);
            display.println("INCONNU");
          }
        } else {
          Serial.println("Erreur de lecture du JSON");
        }
      } else {
        Serial.println("Erreur requête HTTP");
        display.clearDisplay();
        display.setCursor(0, 20);
        display.println("Erreur Serveur");
      }
      
      display.display();
      http.end();
    } else {
      Serial.println("❌ Erreur : Wi-Fi déconnecté");
    }
    
    // Attendre 3 secondes pour que l'utilisateur lise son nom
    delay(3000); 

    // Retour à l'écran d'accueil
    display.clearDisplay();
    display.setTextSize(2);
    display.setCursor(10, 20);
    display.println("BADGEZ !");
    display.display();
  }
}
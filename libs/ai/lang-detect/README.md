/**
 * @file        Librairie pour la détection de langue (Français, Arabe, Darija)
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-27
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

# Librairie AI - Détection de Langue

Cette librairie contient la logique Genkit pour la détection automatique de la langue des messages entrants (Français, Arabe Classique, Darija Marocaine).

## Fonctionnalités

- Utilise CLD3 pour une détection rapide.
- Fallback sur un modèle LLM (Gemini) pour améliorer la précision, notamment pour le Darija.
- Configurable via `flows.config.ts`.

## Commandes utiles

*   **Lancer les tests :**
    ```bash
    pnpm nx test ai-lang-detect
    ```
*   **Builder la librairie (si applicable) :**
    ```bash
    # Généralement, les libs sont buildées via les apps qui les consomment
    # pnpm nx build ai-lang-detect --configuration=production 
    ```


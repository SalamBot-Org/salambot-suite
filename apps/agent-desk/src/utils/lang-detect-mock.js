/**
 * @file        Mock local du module de détection de langue pour l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import { __awaiter } from "tslib";
/**
 * Fonction mock pour la détection de langue
 * Simule le comportement de @salambot/ai/lang-detect
 */
export function detectLanguage(text) {
    return __awaiter(this, void 0, void 0, function* () {
        // Simuler un délai réseau
        yield new Promise(resolve => setTimeout(resolve, 300));
        // Mots-clés pour la détection
        const frKeywords = ['bonjour', 'merci', 'comment', 'salut', 'je', 'tu', 'nous', 'vous', 'problème', 'commande'];
        const arKeywords = ['مرحبا', 'شكرا', 'كيف', 'السلام', 'أنا', 'أنت', 'نحن', 'أنتم', 'مشكلة', 'طلب'];
        const darijaKeywords = ['labas', 'wach', 'chno', 'kifach', '3lik', 'bghit', 'dyal', 'zwin', 'mochkil', 'commande'];
        // Convertir en minuscules pour la comparaison
        const lowerText = text.toLowerCase();
        // Compter les occurrences de mots-clés
        let frCount = 0;
        let arCount = 0;
        let darijaCount = 0;
        frKeywords.forEach(word => {
            if (lowerText.includes(word))
                frCount++;
        });
        arKeywords.forEach(word => {
            if (lowerText.includes(word))
                arCount++;
        });
        darijaKeywords.forEach(word => {
            if (lowerText.includes(word))
                darijaCount++;
        });
        // Déterminer la langue en fonction du nombre de mots-clés trouvés
        if (frCount > arCount && frCount > darijaCount) {
            return {
                lang: 'fr',
                confidence: 0.8 + (frCount * 0.05),
                mode: 'cloud',
                latency: 120,
                fallback: false,
                source: 'cloud'
            };
        }
        else if (arCount > frCount && arCount > darijaCount) {
            return {
                lang: 'ar',
                confidence: 0.85 + (arCount * 0.03),
                mode: 'cloud',
                latency: 150,
                fallback: false,
                source: 'cloud'
            };
        }
        else if (darijaCount > 0) {
            return {
                lang: 'ar-ma',
                confidence: 0.75 + (darijaCount * 0.05),
                mode: 'offline',
                latency: 50,
                fallback: true,
                source: 'offline'
            };
        }
        else {
            // Si aucun mot-clé n'est trouvé ou texte vide
            return {
                lang: 'unknown',
                confidence: 0.5,
                mode: 'offline',
                latency: 10,
                fallback: true,
                source: 'offline'
            };
        }
    });
}
//# sourceMappingURL=lang-detect-mock.js.map
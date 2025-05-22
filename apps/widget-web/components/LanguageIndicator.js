/**
 * @file        Composant d'indicateur de langue détectée pour le widget SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import { useLanguageStore } from '../store/languageStore';
export default function LanguageIndicator() {
    const { currentLanguage, lastDetection } = useLanguageStore();
    // Affichage du nom de la langue selon la langue détectée
    const getLanguageName = () => {
        switch (currentLanguage) {
            case 'fr':
                return 'Français';
            case 'ar':
                return 'العربية';
            case 'ar-ma':
                return 'الدارجة';
            default:
                return 'Langue inconnue';
        }
    };
    // Affichage de la source de détection (cloud/offline)
    const getSourceLabel = () => {
        if (!lastDetection)
            return '';
        const source = lastDetection.source;
        const fallback = lastDetection.fallback;
        if (fallback) {
            return '(fallback)';
        }
        return source === 'cloud' ? '(cloud)' : '(offline)';
    };
    return (<div className="flex items-center bg-blue-700 px-3 py-1 rounded-full text-sm">
      <span className="mr-1">
        {getLanguageName()}
      </span>
      <span className="text-xs opacity-70">
        {getSourceLabel()}
      </span>
    </div>);
}
//# sourceMappingURL=LanguageIndicator.js.map
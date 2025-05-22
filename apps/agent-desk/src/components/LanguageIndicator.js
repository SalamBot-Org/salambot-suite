/**
 * @file        Composant d'indicateur de langue pour l'Agent Desk SalamBot.
 * @author      SalamBot Team (contact: salam@chebakia.com)
 * @created     2025-05-21
 * @updated     2025-05-21
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */
import { useLanguageStore } from '../store/languageStore';
export default function LanguageIndicator({ size = 'md', showSource = true }) {
    const { currentLanguage, lastDetection, conversationsByLang } = useLanguageStore();
    // Classes selon la taille
    const sizeClasses = {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-2'
    };
    // Couleur selon la langue
    const langColors = {
        'fr': 'bg-blue-100 text-blue-800 border-blue-300',
        'ar': 'bg-green-100 text-green-800 border-green-300',
        'ar-ma': 'bg-amber-100 text-amber-800 border-amber-300',
        'unknown': 'bg-gray-100 text-gray-800 border-gray-300'
    };
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
                return 'Inconnu';
        }
    };
    // Affichage de la source de détection (cloud/offline)
    const getSourceLabel = () => {
        if (!lastDetection || !showSource)
            return '';
        const source = lastDetection.source;
        const fallback = lastDetection.fallback;
        if (fallback) {
            return '(fallback)';
        }
        return source === 'cloud' ? '(cloud)' : '(offline)';
    };
    // Affichage du compteur de conversations
    const getConversationCount = () => {
        return conversationsByLang[currentLanguage] || 0;
    };
    return (<div className={`flex items-center border rounded-full ${sizeClasses[size]} ${langColors[currentLanguage]}`}>
      <span className="font-medium mr-1">
        {getLanguageName()}
      </span>
      {showSource && (<span className="text-xs opacity-70 mr-1">
          {getSourceLabel()}
        </span>)}
      {getConversationCount() > 0 && (<span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-white">
          {getConversationCount()}
        </span>)}
    </div>);
}
//# sourceMappingURL=LanguageIndicator.js.map
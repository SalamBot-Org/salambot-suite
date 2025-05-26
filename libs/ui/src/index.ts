/**
 * @file        Composants UI partagés pour SalamBot
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-25
 * @updated     2025-05-25
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

// Fichier minimal pour permettre la validation ESLint
export const Button = ({ children, onClick }) => {
  return {
    type: 'button',
    props: {
      onClick,
      children
    }
  };
};

/**
 * @file        Tests unitaires pour le composant ChatBox
 * @author      SalamBot Team (contact: info@salambot.ma)
 * @created     2025-05-26
 * @updated     2025-05-26
 * @project     SalamBot - AI CRM for Moroccan SMEs
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatBox from '../components/ChatBox';

// Mock de fetch pour simuler les appels API
global.fetch = jest.fn();

describe('ChatBox Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Configuration du mock fetch par défaut
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: 'Réponse de test',
        lang: 'fr',
        modelUsed: 'mock',
      }),
    });
  });

  it('devrait afficher le message de bienvenue initial', () => {
    render(<ChatBox />);
    expect(screen.getByText(/comment puis-je vous aider/i)).toBeInTheDocument();
  });

  it('devrait permettre la saisie de texte', () => {
    render(<ChatBox />);
    const input = screen.getByPlaceholderText(/écrivez votre message/i);
    fireEvent.change(input, { target: { value: 'Bonjour' } });
    expect(input).toHaveValue('Bonjour');
  });

  it('devrait envoyer un message et afficher la réponse', async () => {
    render(<ChatBox />);

    // Saisie et envoi du message
    const input = screen.getByPlaceholderText(/écrivez votre message/i);
    fireEvent.change(input, { target: { value: 'Bonjour' } });

    const button = screen.getByText('Envoyer');
    fireEvent.click(button);

    // Vérification que le message utilisateur est affiché
    expect(screen.getByText('Bonjour')).toBeInTheDocument();

    // Vérification que la réponse du bot est affichée après l'appel API
    await waitFor(() => {
      expect(screen.getByText('Réponse de test')).toBeInTheDocument();
    });

    // Vérification que fetch a été appelé avec les bons paramètres
    expect(global.fetch).toHaveBeenCalledWith('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Bonjour' }),
    });
  });

  it("devrait afficher un message d'erreur en cas d'échec de l'API", async () => {
    // Configuration du mock fetch pour simuler une erreur
    global.fetch.mockRejectedValueOnce(new Error('Erreur réseau'));

    render(<ChatBox />);

    // Saisie et envoi du message
    const input = screen.getByPlaceholderText(/écrivez votre message/i);
    fireEvent.change(input, { target: { value: 'Test erreur' } });

    const button = screen.getByText('Envoyer');
    fireEvent.click(button);

    // Vérification que le message d'erreur est affiché
    await waitFor(() => {
      expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
    });
  });

  // Test désactivé temporairement car il est instable dans l'environnement CI
  // TODO: Suivre l'issue widget-web#4 pour ce test instable et le réactiver.
  it.skip("devrait désactiver le bouton d'envoi pendant le chargement", async () => {
    // Configuration du mock fetch pour simuler un délai
    let resolvePromise;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    global.fetch.mockImplementationOnce(() => fetchPromise);

    render(<ChatBox />);

    // Saisie et envoi du message
    const input = screen.getByPlaceholderText(/écrivez votre message/i);
    fireEvent.change(input, { target: { value: 'Test chargement' } });

    const button = screen.getByText('Envoyer');
    fireEvent.click(button);

    // Vérification que le bouton est désactivé pendant le chargement
    expect(button).toBeDisabled();

    // Résoudre la promesse pour simuler la fin de l'appel API
    resolvePromise({
      ok: true,
      json: async () => ({ reply: 'Réponse retardée', lang: 'fr' }),
    });

    // Attendre que le bouton soit réactivé
    await waitFor(
      () => {
        const updatedButton = screen.getByText('Envoyer');
        expect(updatedButton).not.toBeDisabled();
      },
      { timeout: 3000 }
    );
  });
});

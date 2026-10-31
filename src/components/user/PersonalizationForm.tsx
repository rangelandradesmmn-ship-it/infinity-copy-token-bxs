'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { UserWithSettings } from '@/types';
import {
  updateAllowedUserPersonalization,
  AllowedUserPersonalization,
} from '@/lib/dataService';
import {
  validateImageFile,
  isValidHttpsUrl,
  buildWhatsAppUrl,
  sanitizePhoneNumber,
  cleanLocalPhoneNumber,
} from '@/lib/security';
import {
  User,
  Upload,
  Link as LinkIcon,
  MessageCircle,
  ExternalLink,
  Check,
  AlertCircle,
  Loader2,
  Trash2,
  Lock,
} from 'lucide-react';

interface PersonalizationFormProps {
  user: UserWithSettings;
  onSaved: (updatedUser: UserWithSettings) => void;
}

export function PersonalizationForm({ user, onSaved }: PersonalizationFormProps) {
  // Field 1: Name
  const [name, setName] = useState(user.name || '');

  // Field 2: Profile photo
  const [profileImageUrl, setProfileImageUrl] = useState(
    user.settings?.profile_image_url || ''
  );
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Field 3: Registration link
  const [registrationUrl, setRegistrationUrl] = useState(
    user.settings?.registration_url || ''
  );
  const [urlError, setUrlError] = useState('');

  // Field 4: WhatsApp
  const initialCountryCode = user.settings?.whatsapp_country_code || '+55';
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [whatsappNumber, setWhatsappNumber] = useState(
    cleanLocalPhoneNumber(initialCountryCode, user.settings?.whatsapp_number || '')
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    user.settings?.whatsapp_message || 'Olá! Vi sua página exclusiva e gostaria de mais informações.'
  );

  // Status states
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  // Handle Photo File Upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateImageFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Arquivo de imagem inválido.');
      return;
    }

    // Convert to Data URL for instant preview and offline/Supabase storage compatibility
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setProfileImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setProfileImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Live generated WhatsApp URL preview
  const liveWhatsAppUrl = buildWhatsAppUrl(countryCode, whatsappNumber, whatsappMessage);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setUrlError('');

    // Validation 1: Name
    if (!name.trim()) {
      setFeedback({ type: 'error', text: 'O nome de exibição é obrigatório.' });
      return;
    }

    // Validation 2: Registration URL (if provided)
    if (registrationUrl.trim() && !isValidHttpsUrl(registrationUrl.trim())) {
      setUrlError('O link deve ser uma URL válida começando com https://');
      setFeedback({
        type: 'error',
        text: 'Por favor, corrija o link de cadastro para o formato https://...',
      });
      return;
    }

    setSaving(true);
    try {
      const localCleanNumber = cleanLocalPhoneNumber(countryCode, whatsappNumber);
      const payload: AllowedUserPersonalization = {
        name: name.trim(),
        profile_image_url: profileImageUrl,
        registration_url: registrationUrl.trim(),
        whatsapp_country_code: countryCode,
        whatsapp_number: localCleanNumber,
        whatsapp_message: whatsappMessage.trim(),
      };

      const res = await updateAllowedUserPersonalization(user.id, payload);

      if (res.success) {
        setFeedback({ type: 'success', text: res.message });
        setWhatsappNumber(localCleanNumber);
        onSaved({
          ...user,
          name: payload.name || user.name,
          settings: {
            id: user.settings?.id || 'set-id',
            user_id: user.id,
            profile_image_url: profileImageUrl,
            registration_url: payload.registration_url || '',
            whatsapp_country_code: countryCode,
            whatsapp_number: localCleanNumber,
            whatsapp_message: payload.whatsapp_message || '',
            updated_at: new Date().toISOString(),
          },
        });
      } else {
        setFeedback({ type: 'error', text: res.message });
      }
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Falha ao salvar personalizações.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {feedback && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
              : 'bg-red-500/10 border border-red-500/30 text-red-400'
          }`}
        >
          {feedback.type === 'success' ? (
            <Check className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* FIELD 1: Display Name */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
          <label htmlFor="user-name-input" className="text-base font-bold text-white">
            Campo 1 — Nome de Exibição
          </label>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Este é o nome que aparecerá no cabeçalho, na seção do consultor credenciado e no rodapé da sua landing page.
        </p>

        <input
          id="user-name-input"
          type="text"
          value={name}
          maxLength={70}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: João da Silva"
          required
          className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
        />
        <div className="flex justify-end mt-1 text-[11px] text-slate-400">
          {name.length}/70 caracteres
        </div>
      </div>

      {/* FIELD 2: Profile Photo */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Upload className="w-4 h-4" />
          </div>
          <label className="text-base font-bold text-white">
            Campo 2 — Foto de Perfil
          </label>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Envie uma foto profissional do seu rosto. Formatos aceitos: JPG, PNG ou WEBP (máximo 5MB).
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar Preview */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-emerald-500 flex items-center justify-center shrink-0 shadow-md">
            {profileImageUrl ? (
              <Image
                src={profileImageUrl}
                alt="Prévia do perfil"
                fill
                sizes="96px"
                className="object-cover"
              />
            ) : (
              <User className="w-10 h-10 text-slate-400" />
            )}
          </div>

          <div className="flex-1 w-full space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors border border-slate-700"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Escolher Imagem</span>
              </button>

              {profileImageUrl && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remover Foto</span>
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />

            {uploadError && (
              <p className="text-xs text-red-400 font-medium">{uploadError}</p>
            )}
            <p className="text-[11px] text-slate-400">
              Dica: Fotos bem iluminadas com fundo neutro aumentam em até 32% a taxa de contato no WhatsApp.
            </p>
          </div>
        </div>
      </div>

      {/* FIELD 3: Personal Registration Link */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <LinkIcon className="w-4 h-4" />
          </div>
          <label htmlFor="reg-url-input" className="text-base font-bold text-white">
            Campo 3 — Link Pessoal de Cadastro
          </label>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Insira seu link de indicação ou afiliado. Todos os botões de cadastro da sua página direcionarão para este link.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="reg-url-input"
            type="url"
            value={registrationUrl}
            onChange={(e) => {
              setRegistrationUrl(e.target.value);
              setUrlError('');
            }}
            placeholder="https://plataforma.com/cadastro?ref=seucodigo"
            className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm transition-colors"
          />

          {registrationUrl && (
            <a
              href={registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-700 shrink-0"
            >
              <span>Testar Destino</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        {urlError && <p className="text-xs text-red-400 mt-2">{urlError}</p>}
      </div>

      {/* FIELD 4: WhatsApp */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-green-500/10 text-green-400 flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <label htmlFor="whatsapp-num-input" className="text-base font-bold text-white">
            Campo 4 — WhatsApp de Atendimento
          </label>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Número com DDD para onde os visitantes da sua página serão encaminhados ao clicar nos botões de contato.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div>
            <label htmlFor="country-code-select" className="block text-xs font-semibold text-slate-400 mb-1">
              País (Código)
            </label>
            <select
              id="country-code-select"
              value={countryCode}
              onChange={(e) => {
                const newCode = e.target.value;
                setCountryCode(newCode);
                setWhatsappNumber((prev) => cleanLocalPhoneNumber(newCode, prev));
              }}
              className="w-full px-3 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 text-sm"
            >
              <option value="+55">Brasil (+55)</option>
              <option value="+1">Estados Unidos (+1)</option>
              <option value="+351">Portugal (+351)</option>
              <option value="+34">Espanha (+34)</option>
              <option value="+44">Reino Unido (+44)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="whatsapp-num-input" className="block text-xs font-semibold text-slate-400 mb-1">
              Número com DDD (Apenas dígitos)
            </label>
            <input
              id="whatsapp-num-input"
              type="tel"
              value={whatsappNumber}
              onChange={(e) => {
                const cleaned = cleanLocalPhoneNumber(countryCode, e.target.value);
                setWhatsappNumber(cleaned);
              }}
              placeholder="Ex: 11999998888"
              className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="whatsapp-msg-input" className="block text-xs font-semibold text-slate-400 mb-1">
            Mensagem Inicial Predefinida (Opcional)
          </label>
          <input
            id="whatsapp-msg-input"
            type="text"
            value={whatsappMessage}
            onChange={(e) => setWhatsappMessage(e.target.value)}
            placeholder="Ex: Olá! Acessei sua página e gostaria de informações."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-sm"
          />
        </div>

        {liveWhatsAppUrl && (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="truncate">Link gerado: <strong className="text-emerald-400">{liveWhatsAppUrl}</strong></span>
            <a
              href={liveWhatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-emerald-400 hover:underline flex items-center gap-1 shrink-0 font-semibold"
            >
              <span>Testar</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </div>

      {/* Security & Restricted Fields Notice (Requirement 5: Bloqueio das personalizações) */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
        <Lock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-300">Estrutura e Conteúdo Centralizados:</strong>
          <p className="mt-1 leading-relaxed">
            Vídeos institucionais, textos principais, depoimentos, cores e layout são gerenciados diretamente pelo Super Admin. Quando a página principal for atualizada, sua página receberá as melhorias automaticamente, preservando seus 4 dados individuais acima.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm shadow-xl shadow-blue-950/40 transition-all duration-200 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvando Alterações...</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Salvar Minhas Configurações</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

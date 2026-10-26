import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Globe,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Download,
  Printer,
  Smartphone,
  Cloud,
  CheckCircle2,
  Layers,
  Sparkles,
  Heart,
  Film,
  GraduationCap,
  DollarSign,
  Flame,
  ArrowRight,
  Info,
  Send,
  MessageSquare,
  Compass,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { ChurchLogo } from '../components/common/ChurchLogo';

interface WebPublishPageProps {
  onNavigateToPublicHome?: () => void;
  onNavigateToPage?: (page: string) => void;
}

export const WebPublishPage: React.FC<WebPublishPageProps> = ({
  onNavigateToPublicHome,
  onNavigateToPage,
}) => {
  const { settings, currentUser } = useAuth();
  const isPastorOrAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'PASTEUR';

  if (!isPastorOrAdmin) {
    return (
      <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 max-w-lg mx-auto mt-12 animate-in fade-in">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#C99B2E] border border-amber-200 flex items-center justify-center mx-auto shadow-inner">
          <Globe className="w-7 h-7" />
        </div>
        <h2 className="text-lg font-black text-[#4A0E17]">Accès Réservé à la Direction Paroissiale</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          La publication web et la diffusion officielle du portail de l'église sont réservées exclusivement à l'administrateur et au pasteur de la paroisse.
        </p>
        <button
          onClick={onNavigateToPublicHome}
          className="px-4 py-2 bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold rounded-xl transition shadow cursor-pointer"
        >
          Retourner au Portail Public
        </button>
      </div>
    );
  }

  // Active public URL determination
  const [publicUrl, setPublicUrl] = useState(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return window.location.origin;
    }
    return 'https://ais-pre-5uzhutrazsqyadbzfvkmmp-676095959196.europe-west1.run.app';
  });

  const [activeTab, setActiveTab] = useState<'share' | 'qrcode' | 'pwa' | 'hosting' | 'modules'>('share');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrCaption, setQrCaption] = useState('Scannez pour accéder au portail web & cultes en direct');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwaInstalled, setIsPwaInstalled] = useState(false);
  const [customDomainInput, setCustomDomainInput] = useState('');

  // Generate QR Code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = await QRCode.toDataURL(publicUrl, {
          width: 400,
          margin: 2,
          color: {
            dark: '#4A0E17',
            light: '#FFFFFF',
          },
        });
        setQrCodeDataUrl(url);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };
    generateQR();
  }, [publicUrl]);

  // PWA Prompt Detection
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsPwaInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(id);
    setTimeout(() => setCopiedLink(null), 3000);
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsPwaInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handlePrintFlyer = () => {
    window.print();
  };

  // WhatsApp Share Message
  const whatsappShareText = encodeURIComponent(
    `⛪ *${settings.churchName} — Sangmelima*\n\n` +
      `Bienvenue sur notre portail web officiel 100% accessible en ligne !\n\n` +
      `✨ *Au programme :*\n` +
      `• 🎬 Vidéos YouTube & Photos des cultes récents\n` +
      `• 💳 Offrandes, Dîmes & Dons sécurisés avec reçu immédiat\n` +
      `• 🎓 Institut Biblique Parakletos (inscriptions & cours)\n` +
      `• 🔥 Requêtes de prière & Événements paroissiaux\n\n` +
      `👉 Cliquez ici pour visiter le site : ${publicUrl}`
  );

  const directModuleLinks = [
    {
      id: 'home',
      name: 'Site Web Public (Accueil)',
      url: `${publicUrl}/#public-home`,
      pageKey: 'public-home',
      icon: Globe,
      desc: 'Page vitrine avec cultes, horaires, verset du jour et réseaux sociaux.',
      badge: 'Portail Principal',
    },
    {
      id: 'media',
      name: 'Galerie Médias des Cultes',
      url: `${publicUrl}/#media`,
      pageKey: 'media-gallery',
      icon: Film,
      desc: 'Photos de la chorale, vidéos YouTube des prédications et moments de louange.',
      badge: 'Photos & YouTube',
    },
    {
      id: 'finances',
      name: 'Offrandes & Dîmes en Ligne',
      url: `${publicUrl}/#finances`,
      pageKey: 'finances',
      icon: DollarSign,
      desc: 'Dîmes, offrandes de culte et dons de bâtisseurs avec reçus numériques instantanés.',
      badge: 'Mobile Money',
    },
    {
      id: 'parakletos',
      name: 'Institut Biblique Parakletos',
      url: `${publicUrl}/#parakletos`,
      pageKey: 'parakletos',
      icon: GraduationCap,
      desc: 'Demandes d’adhésion pour nouveaux étudiants, espace enseignant et notes.',
      badge: 'École Biblique',
    },
    {
      id: 'prayers',
      name: 'Requêtes de Prière en Ligne',
      url: `${publicUrl}/#prayer-requests`,
      pageKey: 'prayer-requests',
      icon: Flame,
      desc: 'Déposer une intention de prière confidentielle ou publique pour l’intercession.',
      badge: 'Intercession',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Printable Parochial Flyer (Visible only during print) */}
      <div className="hidden print:block bg-white p-8 text-black font-sans max-w-2xl mx-auto border-4 border-[#4A0E17] rounded-3xl">
        <div className="text-center space-y-4">
          <div className="inline-block p-4 rounded-2xl bg-[#4A0E17] text-white">
            <h1 className="text-2xl font-black uppercase tracking-wider">
              {settings.churchName}
            </h1>
            <p className="text-sm font-semibold text-amber-300">
              Sangmelima • Sud Cameroun
            </p>
          </div>

          <h2 className="text-xl font-bold text-slate-800">
            Retrouvez Votre Église en Ligne & Gratuitement
          </h2>
          <p className="text-sm text-slate-600 max-w-lg mx-auto">
            Accédez aux prédications, cultes en direct sur YouTube, offrandes en ligne, cours de l’Institut Parakletos et requêtes de prières.
          </p>

          {qrCodeDataUrl && (
            <div className="my-6 inline-block p-4 border-2 border-dashed border-[#4A0E17] rounded-2xl bg-slate-50">
              <img
                src={qrCodeDataUrl}
                alt="QR Code EMF Sangmelima"
                className="w-64 h-64 mx-auto"
              />
              <p className="text-xs font-bold text-[#4A0E17] mt-2">
                {qrCaption}
              </p>
            </div>
          )}

          <div className="text-sm font-mono font-bold text-[#4A0E17] bg-slate-100 py-2 px-4 rounded-lg inline-block">
            {publicUrl}
          </div>

          <div className="pt-6 border-t border-slate-300 grid grid-cols-3 gap-4 text-xs">
            <div>
              <span className="font-bold block">Dimanche 09h00</span>
              <span className="text-slate-600">Grand Culte</span>
            </div>
            <div>
              <span className="font-bold block">Mercredi 17h30</span>
              <span className="text-slate-600">Étude Biblique</span>
            </div>
            <div>
              <span className="font-bold block">Vendredi 18h00</span>
              <span className="text-slate-600">Intercession</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 pt-4">
            {settings.address} — Sangmelima • Tél : {settings.phone}
          </p>
        </div>
      </div>

      {/* Main Screen Content */}
      <div className="print:hidden space-y-6">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-[#C99B2E]/40 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-[#C99B2E]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Publication Gratuite sur le Web • 100% En Ligne & Actif</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Publication Gratuite du Site Web de l’Église
              </h1>
              <p className="text-sm text-slate-200 leading-relaxed">
                Votre église dispose d’un portail web complet et moderne, hébergé gratuitement dans le Cloud. 
                Partagez l’adresse avec tous les fidèles, affichez le QR code au temple et permettez à chacun de suivre les cultes, donner sa dîme et s’inscrire à l’Institut Parakletos.
              </p>
            </div>

            {/* Quick Action Box */}
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 flex flex-col gap-3 min-w-[260px]">
              <div className="text-xs text-amber-300 font-bold uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-[#C99B2E]" />
                <span>Accès Web Direct</span>
              </div>
              <button
                onClick={() => {
                  if (onNavigateToPublicHome) {
                    onNavigateToPublicHome();
                  } else {
                    window.open(publicUrl, '_blank');
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#C99B2E] text-[#4A0E17] text-xs font-black hover:bg-amber-400 transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Globe className="w-4 h-4" />
                <span>Voir le Site Public en Direct</span>
              </button>
              <button
                onClick={() => handleCopy(publicUrl, 'hero')}
                className="w-full py-2 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {copiedLink === 'hero' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300 font-bold">Lien Copié !</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier l’Adresse Web</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-2 shadow-xs border border-slate-200 flex flex-wrap gap-1.5">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'share'
                ? 'bg-[#4A0E17] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>1. Lien & Partage Web</span>
          </button>
          <button
            onClick={() => setActiveTab('qrcode')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'qrcode'
                ? 'bg-[#4A0E17] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>2. QR Code & Affiche Paroissiale</span>
          </button>
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'modules'
                ? 'bg-[#4A0E17] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>3. Liens Directs par Module</span>
          </button>
          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'pwa'
                ? 'bg-[#4A0E17] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>4. Application Mobile Gratuite</span>
          </button>
          <button
            onClick={() => setActiveTab('hosting')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'hosting'
                ? 'bg-[#4A0E17] text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>5. Hébergements Gratuits & Domaines</span>
          </button>
        </div>

        {/* Tab 1: Share & Web Link */}
        {activeTab === 'share' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 space-y-6">
              {/* Web Link Card */}
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-[#4A0E17] flex items-center space-x-2">
                    <Globe className="w-5 h-5 text-[#C99B2E]" />
                    <span>Adresse Web Publique Principale</span>
                  </h2>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    Accessible 24h/24
                  </span>
                </div>

                <div className="flex items-center space-x-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <input
                    type="text"
                    readOnly
                    value={publicUrl}
                    className="flex-1 bg-transparent text-xs font-mono font-semibold text-slate-800 outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopy(publicUrl, 'main-url')}
                    className="px-3 py-1.5 rounded-lg bg-[#4A0E17] text-white text-xs font-bold hover:bg-[#6E1325] transition flex items-center space-x-1.5 cursor-pointer"
                  >
                    {copiedLink === 'main-url' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copié</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier</span>
                      </>
                    )}
                  </button>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                    title="Ouvrir dans un nouvel onglet"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Instant 1-Click Social Sharing */}
                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                    Partage Instantané avec les Fidèles
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/?text=${whatsappShareText}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold">Partager sur WhatsApp</div>
                        <div className="text-[11px] text-emerald-600">Groupes & contacts de l’église</div>
                      </div>
                    </a>

                    {/* Facebook */}
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(publicUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-3 p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition"
                    >
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                        <Share2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <div className="text-xs font-bold">Partager sur Facebook</div>
                        <div className="text-[11px] text-blue-600">Sur la page ou profil</div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Ready-to-copy WhatsApp Announcement Message */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">
                      Message d'invitation prêt pour WhatsApp / SMS :
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          `⛪ *${settings.churchName} — Sangmelima*\nBienvenue sur notre portail web officiel 100% accessible en ligne !\n\n✨ Vidéos YouTube & Photos des cultes, Dîmes & Offrandes en ligne, Institut Biblique Parakletos et Prières.\n\n👉 Accédez ici : ${publicUrl}`,
                          'msg-text'
                        )
                      }
                      className="text-xs text-[#4A0E17] font-bold hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      {copiedLink === 'msg-text' ? (
                        <span className="text-emerald-600">✓ Message copié !</span>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copier le texte</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 font-sans leading-relaxed whitespace-pre-line">
                    {`⛪ *${settings.churchName} — Sangmelima*\nBienvenue sur notre portail web officiel 100% accessible en ligne !\n\n✨ Vidéos YouTube & Photos des cultes, Dîmes & Offrandes en ligne, Institut Biblique Parakletos et Prières.\n\n👉 Accédez ici : ${publicUrl}`}
                  </div>
                </div>
              </div>

              {/* Status summary */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2">
                  <div className="text-emerald-600 font-black text-lg">Gratuit</div>
                  <div className="text-[11px] text-slate-500">Coût d’Hébergement</div>
                </div>
                <div className="p-2">
                  <div className="text-[#4A0E17] font-black text-lg">HTTPS / SSL</div>
                  <div className="text-[11px] text-slate-500">Connexion Sécurisée</div>
                </div>
                <div className="p-2">
                  <div className="text-[#C99B2E] font-black text-lg">100%</div>
                  <div className="text-[11px] text-slate-500">Mobile & PC Responsive</div>
                </div>
                <div className="p-2">
                  <div className="text-indigo-600 font-black text-lg">Illimité</div>
                  <div className="text-[11px] text-slate-500">Visiteurs & Membres</div>
                </div>
              </div>
            </div>

            {/* Right Column: Social Share Preview Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-[#C99B2E]" />
                  <h2 className="text-base font-bold text-[#4A0E17]">
                    Aperçu Social (WhatsApp / Facebook)
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  Voici comment votre lien s’affiche automatiquement quand un fidèle le reçoit dans WhatsApp ou sur les réseaux :
                </p>

                <div className="rounded-2xl border border-slate-300 overflow-hidden shadow-sm bg-white">
                  <div className="relative h-44 bg-[#4A0E17] flex items-center justify-center p-4">
                    <img
                      src="/logo.png"
                      alt="Logo EMF"
                      className="w-20 h-20 object-contain drop-shadow-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                      Sangmelima • Sud Cameroun
                    </div>
                  </div>
                  <div className="p-4 space-y-1.5 bg-slate-50">
                    <div className="text-[10px] uppercase font-bold text-slate-400">
                      {new URL(publicUrl).hostname}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">
                      EMF SMART — {settings.churchName}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      Portail web officiel de l’Église Missionnaire de la Foi de Sangmelima. Cultes, vidéos, offrandes et école biblique Parakletos.
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      if (onNavigateToPublicHome) {
                        onNavigateToPublicHome();
                      } else {
                        window.open(publicUrl, '_blank');
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#4A0E17] text-white text-xs font-bold hover:bg-[#6E1325] transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                  >
                    <span>Tester le Site Web Public</span>
                    <ArrowRight className="w-4 h-4 text-[#C99B2E]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: QR Code & Church Flyer */}
        {activeTab === 'qrcode' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 text-center space-y-4">
              <h2 className="text-base font-bold text-[#4A0E17]">
                QR Code Haute Résolution
              </h2>
              <p className="text-xs text-slate-500">
                Scannable instantanément avec tout smartphone Android ou iPhone sans application spéciale.
              </p>

              {qrCodeDataUrl ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 inline-block shadow-inner">
                  <img
                    src={qrCodeDataUrl}
                    alt="QR Code"
                    className="w-56 h-56 mx-auto rounded-lg"
                  />
                  <p className="text-xs font-bold text-[#4A0E17] mt-3">
                    {qrCaption}
                  </p>
                </div>
              ) : (
                <div className="w-56 h-56 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
                  <span className="text-xs text-slate-400">Génération du QR Code...</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                {qrCodeDataUrl && (
                  <a
                    href={qrCodeDataUrl}
                    download="qrcode-emf-sangmelima.png"
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4 text-[#4A0E17]" />
                    <span>Télécharger l’Image</span>
                  </a>
                )}
                <button
                  onClick={handlePrintFlyer}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold transition flex items-center justify-center space-x-2 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4 text-[#C99B2E]" />
                  <span>Imprimer l’Affiche A4</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-5">
              <h2 className="text-base font-bold text-[#4A0E17] flex items-center space-x-2">
                <Printer className="w-5 h-5 text-[#C99B2E]" />
                <span>Personnalisation de l’Affiche Paroissiale</span>
              </h2>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Texte sous le QR Code :
                  </label>
                  <input
                    type="text"
                    value={qrCaption}
                    onChange={(e) => setQrCaption(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#6E1325] focus:outline-none"
                    placeholder="Ex: Scannez pour les cultes & offrandes..."
                  />
                </div>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-2">
                  <div className="font-bold flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-600" />
                    <span>Où afficher ce QR Code à l’église ?</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                    <li>À l’entrée du temple (panneau d’affichage paroissial)</li>
                    <li>Sur les bulletins et livrets de cantiques du culte</li>
                    <li>Projeté sur l’écran géant ou vidéoprojecteur avant le début du culte</li>
                    <li>Sur les enveloppes de dîmes et reçus d’offrandes</li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="font-bold text-slate-800">
                    Avantages du QR Code pour la congrégation :
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    Les fidèles n’ont plus besoin de saisir de longues adresses web. Un simple scan avec l’appareil photo du téléphone ouvre directement la page d’accueil, la galerie des cultes, le formulaire d’offrande Mobile Money ou l’Institut Biblique Parakletos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Direct Module Links */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
              <h2 className="text-base font-bold text-[#4A0E17]">
                Liens Web Directs vers les Sections Clés
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Partagez un lien spécifique pour amener directement les fidèles ou visiteurs vers le service dont ils ont besoin :
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {directModuleLinks.map((mod) => {
                const IconComponent = mod.icon;
                return (
                  <div
                    key={mod.id}
                    className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col justify-between space-y-4 hover:border-[#4A0E17] transition"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-9 h-9 rounded-xl bg-[#4A0E17]/10 text-[#4A0E17] flex items-center justify-center">
                            <IconComponent className="w-5 h-5 text-[#C99B2E]" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-[#4A0E17]">{mod.name}</h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                              {mod.badge}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{mod.desc}</p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <div className="text-[11px] font-mono text-slate-500 bg-slate-50 p-2 rounded-lg truncate select-all">
                        {mod.url}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopy(mod.url, mod.id)}
                          className="flex-1 py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          {copiedLink === mod.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-bold">Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copier le Lien</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            if (onNavigateToPage) {
                              onNavigateToPage(mod.pageKey);
                            } else {
                              window.location.hash = mod.pageKey;
                            }
                          }}
                          className="py-1.5 px-3 rounded-lg bg-[#4A0E17] hover:bg-[#6E1325] text-white text-xs font-bold transition flex items-center space-x-1 cursor-pointer"
                        >
                          <span>Visiter</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: PWA Mobile App */}
        {activeTab === 'pwa' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Application Mobile Gratuite (PWA)</span>
                </div>
                <h2 className="text-xl font-bold text-[#4A0E17]">
                  Transformez le Site en Application sur Téléphone
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Grâce à la technologie PWA (Progressive Web App), tous les membres de l’église peuvent installer l’application directement sur leur smartphone sans passer par Google Play Store ni Apple App Store. C'est 100% gratuit et instantané.
                </p>
              </div>

              {/* Install button if prompt available */}
              {deferredPrompt && (
                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-emerald-900">
                      Installation Directe Disponible
                    </div>
                    <div className="text-xs text-emerald-700">
                      Votre navigateur permet d’ajouter l’app en 1 clic.
                    </div>
                  </div>
                  <button
                    onClick={handleInstallPwa}
                    className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-md flex items-center space-x-2 cursor-pointer flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>Installer Maintenant</span>
                  </button>
                </div>
              )}

              {/* Guide Android */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-[#4A0E17] flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-black">
                    A
                  </span>
                  <span>Guide pour Android (Chrome, Samsung Internet, Edge)</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <li>Ouvrez l’adresse web <strong>{publicUrl}</strong> dans Chrome.</li>
                  <li>Appuyez sur le menu ⋮ (trois points en haut à droite).</li>
                  <li>Sélectionnez <strong>« Ajouter à l'écran d'accueil »</strong> ou <strong>« Installer l'application »</strong>.</li>
                  <li>L’icône officielle de l’église apparaît parmi vos applications !</li>
                </ol>
              </div>

              {/* Guide iPhone */}
              <div className="space-y-3 pt-2">
                <h3 className="text-sm font-bold text-[#4A0E17] flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-black">
                    i
                  </span>
                  <span>Guide pour iPhone & iPad (Safari)</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <li>Ouvrez <strong>{publicUrl}</strong> dans <strong>Safari</strong>.</li>
                  <li>Appuyez sur le bouton de partage en bas (carré avec flèche vers le haut ⎋).</li>
                  <li>Faites défiler vers le bas et touchez <strong>« Sur l'écran d'accueil »</strong> (+).</li>
                  <li>Validez avec <strong>« Ajouter »</strong> en haut à droite.</li>
                </ol>
              </div>
            </div>

            {/* PWA Benefits */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                <h3 className="text-base font-bold text-[#4A0E17]">
                  Pourquoi la PWA est Idéale pour Sangmelima ?
                </h3>

                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Zéro Frais de Téléchargement</span>
                      <span className="text-slate-600">Pas de carte bancaire, pas de compte Apple/Google requis.</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Légèreté & Vitesse</span>
                      <span className="text-slate-600">Prend moins de 2 Mo d'espace, démarre instantanément même avec une connexion 3G/4G modeste.</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900 block">Mises à Jour Automatiques</span>
                      <span className="text-slate-600">Dès que vous publiez de nouvelles photos ou cultes, tous les téléphones reçoivent les nouveautés sans mise à jour manuelle.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Free Hosting & Custom Domains */}
        {activeTab === 'hosting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-3">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-200">
                <Cloud className="w-3.5 h-3.5" />
                <span>Options de Déploiement & Pérennité Web Gratuite</span>
              </div>
              <h2 className="text-xl font-bold text-[#4A0E17]">
                Comment Maintenir & Publier Gratuitement pour Toujours
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                Votre application est déjà 100% opérationnelle en ligne. Si vous souhaitez en plus la déployer sur votre propre compte ou lier un nom de domaine personnalisé comme <code>emfsangmelima.org</code>, voici les options gratuites recommandées :
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Option 1: AI Studio / Google Cloud */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border-2 border-emerald-500/60 relative space-y-3 flex flex-col justify-between">
                <span className="absolute top-3 right-3 text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Actif Maintenant
                </span>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black">
                    G
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Google Cloud / AI Studio</h3>
                  <p className="text-xs text-slate-600">
                    Déjà hébergé et sécurisé avec certificat SSL HTTPS. Disponible 24h/24 sans aucune configuration requise.
                  </p>
                </div>
                <div className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  ✓ Aucun frais • URL active immédiatement
                </div>
              </div>

              {/* Option 2: Vercel */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black text-base">
                    ▲
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Vercel (Hébergement Offert)</h3>
                  <p className="text-xs text-slate-600">
                    Formule Hobby 100% gratuite à vie. CDN ultra-rapide mondial, certificats SSL automatiques et nom de domaine personnalisé gratuit.
                  </p>
                </div>
                <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono">
                  npm run build → vercel deploy
                </div>
              </div>

              {/* Option 3: Netlify & GitHub */}
              <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-xl bg-teal-500 text-white flex items-center justify-center font-black text-base">
                    N
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Netlify / GitHub Pages</h3>
                  <p className="text-xs text-slate-600">
                    Déploiement direct depuis votre code Git avec 100 Go de bande passante gratuite chaque mois.
                  </p>
                </div>
                <div className="text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200 font-mono">
                  git push origin main
                </div>
              </div>
            </div>

            {/* Step-by-Step Guide */}
            <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
              <h3 className="text-base font-bold text-[#4A0E17]">
                Guide Étape par Étape pour Connecter un Nom de Domaine
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-[#4A0E17] flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#4A0E17] text-white flex items-center justify-center text-[10px]">1</span>
                    <span>Souscrire un nom de domaine</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Réservez votre nom d'église (ex. <code>emf-sangmelima.org</code> ou <code>.cm</code>) chez n'importe quel registraire ou profitez d'un sous-domaine gratuit.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-[#4A0E17] flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#4A0E17] text-white flex items-center justify-center text-[10px]">2</span>
                    <span>Ajouter l'enregistrement CNAME</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Dans vos paramètres DNS, pointez le sous-domaine <code>www</code> vers l'adresse fournie par l'hébergeur.
                  </p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="font-bold text-[#4A0E17] flex items-center space-x-1.5">
                    <span className="w-5 h-5 rounded-full bg-[#4A0E17] text-white flex items-center justify-center text-[10px]">3</span>
                    <span>Certificat SSL Gratuit Automatique</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    Le certificat HTTPS est délivré automatiquement pour sécuriser les connexions de tous vos membres.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

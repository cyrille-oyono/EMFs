import React from 'react';
import {
  ExternalLink,
  Share2,
  Tv,
  MessageCircle,
  Video,
  Camera,
  Send,
  Sparkles,
  PhoneCall,
} from 'lucide-react';
import { SystemSettings } from '../../types';

interface ChurchSocialsSectionProps {
  settings: SystemSettings;
}

export const ChurchSocialsSection: React.FC<ChurchSocialsSectionProps> = ({ settings }) => {
  const socials = settings.socials || {};

  const socialLinks = [
    {
      id: 'facebook',
      name: 'Facebook Officiel',
      handle: '@emfsangmelima',
      desc: 'Diffusion des cultes en direct chaque dimanche, albums photos et annonces officielles.',
      url: socials.facebook || 'https://facebook.com/emfsangmelima',
      buttonText: 'Suivre sur Facebook',
      accentColor: '#1877F2',
      bgHover: 'hover:border-[#1877F2]',
      badge: 'Directs & Événements',
      icon: (
        <svg className="w-6 h-6 fill-current text-[#1877F2]" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      id: 'youtube',
      name: 'Chaîne YouTube',
      handle: 'EMF Sangmelima Officiel',
      desc: 'Retransmission intégrale des cultes, clips de la chorale Voix de Sion et séminaires.',
      url: socials.youtube || 'https://youtube.com/@emfsangmelima',
      buttonText: 'S’abonner sur YouTube',
      accentColor: '#FF0000',
      bgHover: 'hover:border-[#FF0000]',
      badge: 'Vidéos & Prédications',
      icon: (
        <svg className="w-6 h-6 fill-current text-[#FF0000]" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      ),
    },
    {
      id: 'whatsapp',
      name: 'Canal & Ligne WhatsApp',
      handle: '+237 699 00 11 22',
      desc: 'Canal d’édification, verset du jour, requêtes pastorales urgentes et groupes d’intercession.',
      url: socials.whatsapp ? (socials.whatsapp.startsWith('http') ? socials.whatsapp : `https://wa.me/${socials.whatsapp.replace(/\D/g, '')}`) : 'https://wa.me/237699001122',
      buttonText: 'Écrire sur WhatsApp',
      accentColor: '#25D366',
      bgHover: 'hover:border-[#25D366]',
      badge: 'Échange & Prière Directe',
      icon: (
        <svg className="w-6 h-6 fill-current text-[#25D366]" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
        </svg>
      ),
    },
    {
      id: 'instagram',
      name: 'Instagram EMF',
      handle: '@emfsangmelima',
      desc: 'Clichés inspirants de nos cultes, citations quotidiennes et moments fraternels de la jeunesse.',
      url: socials.instagram || 'https://instagram.com/emfsangmelima',
      buttonText: 'Rejoindre sur Instagram',
      accentColor: '#E1306C',
      bgHover: 'hover:border-[#E1306C]',
      badge: 'Photos & Inspirations',
      icon: (
        <svg className="w-6 h-6 fill-current text-[#E1306C]" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
    },
    {
      id: 'telegram',
      name: 'Canal Telegram & TikTok',
      handle: 't.me/emfsangmelima',
      desc: 'Notifications instantanées des programmes, podcasts audios et courtes vidéos d’encouragement.',
      url: socials.telegram || 'https://t.me/emfsangmelima',
      buttonText: 'Rejoindre le Canal',
      accentColor: '#0088CC',
      bgHover: 'hover:border-[#0088CC]',
      badge: 'Annonces & Podcasts',
      icon: (
        <svg className="w-6 h-6 fill-current text-[#0088CC]" viewBox="0 0 24 24">
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z" />
        </svg>
      ),
    },
  ];

  return (
    <section id="socials" className="py-16 bg-white border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center space-x-2 text-xs font-black uppercase tracking-wider text-[#C99B2E] bg-amber-50 px-3.5 py-1 rounded-full border border-amber-200">
            <Share2 className="w-3.5 h-3.5 text-[#6E1325]" />
            <span>Communauté Numérique & Réseaux Sociaux</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-[#4A0E17] tracking-tight">
            Restez Connectés à l’Église Missionnaire de la Foi
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Rejoignez des centaines de fidèles sur nos plateformes en ligne. Suivez nos cultes en direct chaque dimanche, écoutez les louanges de la chorale Voix de Sion et partagez l'Évangile à Sangmelima et dans le monde.
          </p>
        </div>

        {/* Social Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {socialLinks.map((item) => (
            <div
              key={item.id}
              className={`p-6 rounded-2xl bg-[#FAF0F2]/50 border border-slate-200 ${item.bgHover} transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between group`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-white text-slate-600 border border-slate-200">
                    {item.badge}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-base text-[#4A0E17] group-hover:text-[#6E1325] transition">
                    {item.name}
                  </h3>
                  <div className="text-xs font-semibold text-slate-500 font-mono mt-0.5">
                    {item.handle}
                  </div>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/80 flex items-center justify-between">
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white transition flex items-center justify-center space-x-2 shadow-xs group-hover:opacity-95"
                  style={{ backgroundColor: item.accentColor }}
                >
                  <span>{item.buttonText}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Follow Strip with Direct Action */}
        <div className="bg-gradient-to-r from-[#4A0E17] via-[#6E1325] to-[#4A0E17] text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-[#C99B2E]/40">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-xs font-black uppercase tracking-widest text-[#C99B2E]">
              Prière & Contact Pastoral Direct
            </span>
            <h4 className="text-lg sm:text-xl font-black text-white">
              Une urgence ou un sujet de prière à confier ?
            </h4>
            <p className="text-xs text-slate-200">
              Nos pasteurs et l'équipe d'intercession vous répondent directement sur WhatsApp et téléphone.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/${(settings.socials?.whatsapp || settings.phone || '237699001122').replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-xl bg-[#25D366] text-white font-extrabold text-xs hover:bg-emerald-600 transition shadow-lg flex items-center space-x-2"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>WhatsApp Pastoral</span>
            </a>

            <a
              href={`tel:${settings.phone}`}
              className="px-5 py-3 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition border border-white/30 flex items-center space-x-2"
            >
              <PhoneCall className="w-4 h-4 text-[#C99B2E]" />
              <span>Appeler ({settings.phone})</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

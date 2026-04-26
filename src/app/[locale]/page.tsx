import { getTranslations } from 'next-intl/server';
import * as motion from 'framer-motion/client';
import { getFirestore } from '@/lib/firebase-admin';
import { Link } from '@/i18n/routing';

export default async function Home() {
  const t = await getTranslations('Hero');
  const tAbout = await getTranslations('About');

  // Fetch dynamic settings from Firestore
  let dynamicSettings: Record<string, string> = {};
  try {
      const firestore = getFirestore();
      if (firestore) {
          const snapshot = await firestore.collection('settings').get();
          snapshot.docs.forEach(doc => {
              dynamicSettings[doc.id] = doc.data().value;
          });
      }
  } catch (e) {
      console.error("Home settings fetch failed", e);
  }

  const heroTitle = dynamicSettings.hero_title || t('title');
  const heroSubtitle = dynamicSettings.hero_subtitle || t('subtitle');
  const heroImage = dynamicSettings.hero_image || "/poster.jpg";
  const aboutText = dynamicSettings.about_text || tAbout('description');
  const aboutHeading = dynamicSettings.about_heading || tAbout('title');
  const aboutImage1 = dynamicSettings.about_image_1 || "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974";
  const aboutImage2 = dynamicSettings.about_image_2 || heroImage;
  const programSchedulePdf = dynamicSettings.program_schedule_pdf || "#";

  const stat1Number = dynamicSettings.stat_1_number || "32+";
  const stat1Label = dynamicSettings.stat_1_label || tAbout('statsLegacy');
  const stat2Number = dynamicSettings.stat_2_number || "26";
  const stat2Label = dynamicSettings.stat_2_label || "States Covered";
  const stat3Number = dynamicSettings.stat_3_number || "5K+";
  const stat3Label = dynamicSettings.stat_3_label || tAbout('statsParticipants');

  return (
    <div className="min-h-screen overflow-x-hidden">
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex flex-col items-center pt-28 md:pt-36 pb-24 overflow-hidden">
        {/* Parallax Background */}
        <motion.div
          className="absolute inset-0 bg-bg-dark"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 10, ease: "easeOut" }}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-bg-dark/80 to-transparent" />

        <div className="relative z-10 text-center px-4 max-w-7xl mx-auto flex flex-col items-center">
          {/* Video Container Top */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative w-full max-w-[95vw] mx-auto mb-10 md:mb-16 px-4 md:px-0"
          >
            <div className="relative w-full aspect-video md:aspect-[21/9] rounded-xl md:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.1)] border border-white/10 group">
              {heroImage.match(/\.(mp4|webm|ogg)$/i) ? (
                <video
                  src={heroImage}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700"
                />
              ) : (
                <img
                  src={heroImage}
                  alt="Festival Presentation"
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent opacity-60" />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl md:rounded-[3rem]" />
            </div>
            {/* Decorative glimmers */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-gold/5 blur-[120px] rounded-full -z-10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="w-full max-w-4xl"
          >
            <h1 className="text-3xl sm:text-4xl md:text-7xl lg:text-8xl font-serif font-bold mb-6 gold-gradient-text drop-shadow-2xl leading-[1.1] break-words">
              {heroTitle}
            </h1>
            <p className="text-base md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto font-light leading-relaxed px-2 md:px-0">
              {heroSubtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/events"
                className="px-8 py-4 bg-gradient-to-r from-maroon to-red-900 text-white rounded-full font-semibold text-lg hover:shadow-[0_0_20px_rgba(107,15,26,0.6)] transition-shadow border border-maroon"
              >
                {t('ctaExplore')}
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                href="/gallery"
                className="px-8 py-4 glass text-white rounded-full font-semibold text-lg hover:bg-white/10 transition-colors"
              >
                {t('ctaGallery')}
              </motion.a>
            </div>
          </motion.div>
        </div>

      </section>

      {/* About Section */}
      <section className="py-24 px-5 max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="space-y-12 text-center"
        >
          <div className="flex flex-col items-center">
            <h2 className="text-4xl md:text-6xl font-serif font-bold text-white mb-6">
              {aboutHeading}
            </h2>
            <div className="w-24 h-1 bg-gold rounded-full" />
          </div>
          
          <div className="glass-card shadow-2xl border border-white/5 relative overflow-hidden backdrop-blur-xl max-w-4xl mx-auto">
             <div className="absolute top-0 right-0 w-32 h-32 bg-gold/10 rounded-full blur-[50px] -z-10" />
             <p className="text-xl text-gray-300 leading-relaxed font-light">
               {aboutText}
             </p>
          </div>

          {/* Interactive Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
             {[
                 { number: stat1Number, label: stat1Label },
                 { number: stat2Number, label: stat2Label },
                 { number: stat3Number, label: stat3Label }
             ].map((stat, i) => (
                 <motion.div 
                     key={i}
                     whileHover={{ y: -5, scale: 1.05 }}
                     className="glass border border-white/10 rounded-2xl p-8 text-center transition-all hover:bg-white/10 hover:border-gold/30 shadow-2xl relative overflow-hidden group"
                 >
                     <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                     <div className="text-4xl lg:text-5xl font-serif font-black gold-gradient-text mb-3 drop-shadow-md relative z-10">{stat.number}</div>
                     <div className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] relative z-10">{stat.label}</div>
                 </motion.div>
             ))}
          </div>
        </motion.div>
      </section>

      {/* Events Quick Links Section */}
      <section className="py-24 px-5 max-w-7xl mx-auto relative overflow-hidden">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-serif font-bold text-white mb-4"
          >
            Explore Highlights
          </motion.h2>
          <motion.div 
            initial={{ opacity: 0, scale: 0 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="w-24 h-1 bg-gradient-to-r from-transparent via-gold to-transparent mx-auto" 
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: dynamicSettings.explore_1_title || 'Live Results', 
              desc: dynamicSettings.explore_1_desc || 'Check the real-time leaderboard and points table.', 
              href: dynamicSettings.explore_1_href || '/results', 
              img: dynamicSettings.explore_1_img || 'https://images.unsplash.com/photo-1543854589-9b9eb2dd45d1?q=80&w=1974&auto=format&fit=crop' 
            },
            { 
              title: dynamicSettings.explore_2_title || 'News & Updates', 
              desc: dynamicSettings.explore_2_desc || 'Stay updated with latest announcements and schedules.', 
              href: dynamicSettings.explore_2_href || '/news', 
              img: dynamicSettings.explore_2_img || 'https://images.unsplash.com/photo-1523580494112-071dcb85170d?q=80&w=1974&auto=format&fit=crop' 
            },
            { 
              title: dynamicSettings.explore_3_title || 'Event Gallery', 
              desc: dynamicSettings.explore_3_desc || 'Relive the magical moments and performances.', 
              href: dynamicSettings.explore_3_href || '/gallery', 
              img: dynamicSettings.explore_3_img || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=1974&auto=format&fit=crop' 
            }
          ].map((item, index) => (
            <Link
              key={item.title}
              href={item.href}
              className="block group"
            >
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                  whileHover={{ y: -10 }}
                  className="glass-card !p-0 overflow-hidden group border border-white/5 hover:border-gold/30 transition-all rounded-2xl h-full"
                >
              <div className="h-48 relative overflow-hidden">
                <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
              <div className="p-8">
                <h3 className="text-2xl font-serif font-bold text-gold-light mb-3">{item.title}</h3>
                <p className="text-gray-400">{item.desc}</p>
              </div>
                </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Decorative Final Section */}
      <section className="py-32 relative overflow-hidden flex items-center justify-center border-t border-white/10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-maroon/20 -z-10" />
        <motion.div
           initial={{ opacity: 0, scale: 0.9, y: 50 }}
           whileInView={{ opacity: 1, scale: 1, y: 0 }}
           viewport={{ once: true, margin: "-100px" }}
           transition={{ duration: 0.8 }}
           className="text-center px-5 max-w-3xl"
        >
          <h2 className="text-5xl md:text-7xl font-serif font-bold gold-gradient-text mb-6">
            Join the Celebration
          </h2>
          <p className="text-xl text-gray-300 mb-10 font-light">
            Experience the vibrant culture and outstanding talents converging at Sahityotsav.
          </p>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href={programSchedulePdf}
            target="_blank"
            rel="noopener noreferrer"
            className="px-10 py-5 bg-white text-black rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-shadow inline-block"
          >
            View Schedule
          </motion.a>
        </motion.div>
      </section>
    </div>
  );
}

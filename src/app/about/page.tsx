'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  Shield, Users, Target, Award, TrendingUp, 
  Heart, Globe, Zap, CheckCircle, ArrowRight
} from 'lucide-react';
import { Navbar, MobileNav, Footer } from '@/components/layout';
import { Button, Card } from '@/components/ui';
import { useI18n } from '@/contexts/I18nContext';

const stats = [
  { value: '50,000+', label: 'BÃ¡o cÃ¡o lá»«a Ä‘áº£o', icon: Shield },
  { value: '25,000+', label: 'ThÃ nh viÃªn', icon: Users },
  { value: '100,000+', label: 'NgÆ°á»i dÃ¹ng Ä‘Æ°á»£c báº£o vá»‡', icon: Heart },
  { value: '99.9%', label: 'Äá»™ chÃ­nh xÃ¡c', icon: Zap },
];

const values = [
  {
    icon: Shield,
    title: 'Báº£o vá»‡ cá»™ng Ä‘á»“ng',
    description: 'ChÃºng tÃ´i cam káº¿t báº£o vá»‡ má»i ngÆ°á»i khá»i cÃ¡c trÃ² lá»«a Ä‘áº£o trá»±c tuyáº¿n thÃ´ng qua viá»‡c cung cáº¥p thÃ´ng tin chÃ­nh xÃ¡c vÃ  ká»‹p thá»i.'
  },
  {
    icon: Target,
    title: 'ChÃ­nh xÃ¡c & KhÃ¡ch quan',
    description: 'Táº¥t cáº£ dá»¯ liá»‡u Ä‘Æ°á»£c xÃ¡c minh ká»¹ lÆ°á»¡ng Ä‘á»ƒ Ä‘áº£m báº£o tÃ­nh chÃ­nh xÃ¡c vÃ  khÃ¡ch quan trong má»i bÃ¡o cÃ¡o.'
  },
  {
    icon: Heart,
    title: 'ÄoÃ n káº¿t cá»™ng Ä‘á»“ng',
    description: 'ChÃºng tÃ´i tin vÃ o sá»©c máº¡nh cá»§a cá»™ng Ä‘á»“ng. Má»—i bÃ¡o cÃ¡o Ä‘á»u Ä‘Ã³ng gÃ³p vÃ o viá»‡c báº£o vá»‡ nhá»¯ng ngÆ°á»i khÃ¡c.'
  },
  {
    icon: Globe,
    title: 'Tiáº¿p cáº­n toÃ n cáº§u',
    description: 'Dá»‹ch vá»¥ cá»§a chÃºng tÃ´i Ä‘Æ°á»£c cung cáº¥p miá»…n phÃ­ cho má»i ngÆ°á»i, báº¥t ká»ƒ vá»‹ trÃ­ Ä‘á»‹a lÃ½ hay hoÃ n cáº£nh.'
  }
];

const team = [
  { name: 'Nguyen Van A', role: 'CEO & Founder', image: 'NVA' },
  { name: 'Tran Thi B', role: 'CTO', image: 'TTB' },
  { name: 'Le Van C', role: 'Head of Operations', image: 'LVC' },
  { name: 'Pham Thi D', role: 'Head of Product', image: 'PTD' },
];

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-20 pb-20 md:pb-8">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 via-blue-500/5 to-primary/10 border-b border-bg-border">
          <div className="max-w-6xl mx-auto px-4 md:px-8 py-16 md:py-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center max-w-3xl mx-auto"
            >
              <h1 className="text-4xl md:text-5xl font-bold text-text-main mb-6">
                Vá» <span className="text-primary">ScamGuard</span>
              </h1>
              <p className="text-lg text-text-secondary mb-8">
                ChÃºng tÃ´i lÃ  ná»n táº£ng kiá»ƒm tra lá»«a Ä‘áº£o hÃ ng Ä‘áº§u Vi 
                giÃºpá»‡t Nam, hÃ ng trÄƒm nghÃ¬n ngÆ°á»i dÃ¹ng an toÃ n trÆ°á»›c cÃ¡c trÃ² lá»«a Ä‘áº£o trá»±c tuyáº¿n.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/report">
                  <Button variant="primary" size="lg">
                    BÃ¡o cÃ¡o lá»«a Ä‘áº£o
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="secondary" size="lg">
                    Kiá»ƒm tra ngay
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 bg-bg-card">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <stat.icon className="w-8 h-8 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-text-main mb-1">{stat.value}</p>
                  <p className="text-sm text-text-muted">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl font-bold text-text-main mb-6">
                  Sá»© má»‡nh cá»§a chÃºng tÃ´i
                </h2>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  ScamGuard Ä‘Æ°á»£c thÃ nh láº­p vá»›i sá»© má»‡nh táº¡o ra má»™t mÃ´i trÆ°á»ng trá»±c tuyáº¿n an toÃ n hÆ¡n 
                  cho ngÆ°á»i Viá»‡t Nam. ChÃºng tÃ´i tin ráº±ng viá»‡c chia sáº» thÃ´ng tin vá» cÃ¡c trÃ² lá»«a Ä‘áº£o 
                  lÃ  cÃ¡ch hiá»‡u quáº£ nháº¥t Ä‘á»ƒ ngÄƒn cháº·n chÃºng.
                </p>
                <p className="text-text-secondary mb-6 leading-relaxed">
                  Vá»›i sá»± há»— trá»£ cá»§a cÃ´ng nghá»‡ AI vÃ  cá»™ng Ä‘á»“ng ngÆ°á»i dÃ¹ng tÃ­ch cá»±c, chÃºng tÃ´i khÃ´ng ngá»«ng 
                  cáº£i thiá»‡n vÃ  má»Ÿ rá»™ng dá»‹ch vá»¥ Ä‘á»ƒ báº£o vá»‡ nhiá»u ngÆ°á»i hÆ¡n.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Miá»…n phÃ­ hoÃ n toÃ n</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Äa ná»n táº£ng</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-text-secondary">
                    <CheckCircle className="w-5 h-5 text-success" />
                    <span>Há»— trá»£ 24/7</span>
                  </div>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="grid grid-cols-2 gap-4"
              >
                <div className="bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-2xl p-6 text-center">
                  <TrendingUp className="w-10 h-10 text-primary mx-auto mb-3" />
                  <p className="text-2xl font-bold text-text-main">200%</p>
                  <p className="text-sm text-text-muted">TÄƒng trÆ°á»Ÿng nÄƒm 2024</p>
                </div>
                <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-2xl p-6 text-center">
                  <Users className="w-10 h-10 text-green-500 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-text-main">25K+</p>
                  <p className="text-sm text-text-muted">ThÃ nh viÃªn tÃ­ch cá»±c</p>
                </div>
                <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl p-6 text-center">
                  <Award className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-text-main">4.8/5</p>
                  <p className="text-sm text-text-muted">ÄÃ¡nh giÃ¡ ngÆ°á»i dÃ¹ng</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 text-center">
                  <Shield className="w-10 h-10 text-purple-500 mx-auto mb-3" />
                  <p className="text-2xl font-bold text-text-main">100K+</p>
                  <p className="text-sm text-text-muted">NgÆ°á»i Ä‘Æ°á»£c báº£o vá»‡</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="py-16 bg-bg-card">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-text-main mb-4">
                GiÃ¡ trá»‹ cá»‘t lÃµi
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Nhá»¯ng nguyÃªn táº¯c Ä‘á»‹nh hÆ°á»›ng má»i hoáº¡t Ä‘á»™ng cá»§a chÃºng tÃ´i
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card hover className="h-full p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <value.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-text-main mb-2">{value.title}</h3>
                    <p className="text-sm text-text-secondary">{value.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="py-16">
          <div className="max-w-6xl mx-auto px-4 md:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold text-text-main mb-4">
                Äá»™i ngÅ© cá»§a chÃºng tÃ´i
              </h2>
              <p className="text-text-secondary max-w-2xl mx-auto">
                Nhá»¯ng ngÆ°á»i Ä‘am mÃª cÃ´ng nghá»‡ vÃ  báº£o vá»‡ cá»™ng Ä‘á»“ng
              </p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {team.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
                    {member.image}
                  </div>
                  <h3 className="font-semibold text-text-main">{member.name}</h3>
                  <p className="text-sm text-text-muted">{member.role}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="py-16">
          <div className="max-w-4xl mx-auto px-4 md:px-8">
            <Card className="bg-gradient-to-r from-primary to-blue-500 p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                Tham gia cÃ¹ng chÃºng tÃ´i
              </h2>
              <p className="text-white/80 mb-6 max-w-xl mx-auto">
                HÃ£y trá»Ÿ thÃ nh má»™t pháº§n cá»§a cá»™ng Ä‘á»“ng ScamGuard Ä‘á»ƒ báº£o vá»‡ báº£n thÃ¢n vÃ  nhá»¯ng ngÆ°á»i thÃ¢n yÃªu khá»i cÃ¡c trÃ² lá»«a Ä‘áº£o trá»±c tuyáº¿n.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/report">
                  <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90">
                    BÃ¡o cÃ¡o lá»«a Ä‘áº£o
                  </Button>
                </Link>
                <Link href="/search">
                  <Button variant="ghost" size="lg" className="border border-white text-white hover:bg-white/10">
                    Kiá»ƒm tra ngay
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
      <MobileNav />
    </div>
  );
}


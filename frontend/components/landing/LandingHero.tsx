'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/stores/walletStore';
import { AuroraBackground } from './AuroraBackground';
import { RoleCards } from './RoleCards';
import { SnowflakeIcon, CheckCircleIcon, LockIcon, ZapIcon } from '@/components/icons';

/**
 * LandingHero — full landing page for unauthenticated users.
 *
 * Sections:
 *  1. Navbar with brand + Connect Wallet CTA
 *  2. Hero section with headline, description, and CTA
 *  3. Features section (What is OmniCold?)
 *  4. How it Works section (step-by-step)
 *  5. Role cards section
 *  6. Footer
 */
export function LandingHero() {
  const { connect, isConnecting, isConnected } = useWalletStore();
  const router = useRouter();
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    if (isConnected) {
      const delay = prefersReduced ? 0 : 500;
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isConnected, router, prefersReduced]);

  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          key="landing-hero"
          initial={{ opacity: 1 }}
          exit={
            prefersReduced
              ? { opacity: 0 }
              : { opacity: 0, filter: 'blur(12px)', transition: { duration: 0.5 } }
          }
          className="relative min-h-screen flex flex-col bg-arctic-navy"
        >
          <AuroraBackground />

          {/* Floating frost particles */}
          {!prefersReduced && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 rounded-full bg-frost-cyan/30"
                  style={{
                    left: `${15 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    opacity: [0.2, 0.6, 0.2],
                    scale: [1, 1.5, 1],
                  }}
                  transition={{
                    duration: 4 + i * 0.5,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.8,
                  }}
                />
              ))}
            </div>
          )}

          {/* ═══════════════ NAVBAR ═══════════════ */}
          <nav className="relative z-20 w-full border-b border-frost-cyan/10 backdrop-blur-sm bg-arctic-navy/60">
            <div className="max-w-6xl mx-auto flex items-center justify-between px-6 h-16">
              {/* Brand */}
              <div className="flex items-center gap-2">
                <SnowflakeIcon className="text-frost-cyan w-6 h-6" />
                <span
                  className="text-xl font-bold tracking-tight"
                  style={{
                    background: 'linear-gradient(90deg, #00D4FF 0%, #F1FAEE 60%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  OmniCold
                </span>
              </div>

              {/* Nav links */}
              <div className="hidden md:flex items-center gap-8 text-sm text-frost-gray">
                <a href="#features" className="hover:text-frost-white transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-frost-white transition-colors">How It Works</a>
                <a href="#roles" className="hover:text-frost-white transition-colors">Roles</a>
                <a href="#faq" className="hover:text-frost-white transition-colors">FAQ</a>
              </div>

              {/* Connect CTA (nav) */}
              <button
                onClick={connect}
                disabled={isConnecting}
                className="px-5 py-2 rounded-lg border border-frost-cyan text-frost-cyan text-sm font-medium
                           hover:bg-frost-cyan/10 transition-all duration-200 min-h-10"
              >
                {isConnecting ? 'Connecting…' : 'Connect Wallet'}
              </button>
            </div>
          </nav>

          {/* ═══════════════ HERO SECTION ═══════════════ */}
          <section
            className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] px-6 py-24 text-center"
            aria-labelledby="hero-heading"
          >
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="flex flex-col items-center gap-6 max-w-3xl"
            >
              {/* Badge */}
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-frost-cyan/30 bg-frost-cyan/5 text-frost-cyan text-xs font-medium tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-frost-cyan animate-pulse" />
                Powered by Stellar Soroban
              </span>

              {/* Headline */}
              <h1
                id="hero-heading"
                className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight select-none leading-[1.1]"
                style={{
                  background: 'linear-gradient(135deg, #F1FAEE 0%, #00D4FF 50%, #1B2A4A 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                OmniCold
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-frost-gray font-light leading-relaxed max-w-2xl">
                IoT-integrated escrow dApp that holds USDC bonds and automatically enforces 
                cold-chain temperature compliance. No disputes. No delays. Just trustless enforcement.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 mt-4">
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className={[
                    'px-8 py-4 rounded-xl font-semibold text-arctic-navy text-lg',
                    'min-h-[52px] min-w-[220px]',
                    'transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-frost-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-arctic-navy',
                    isConnecting
                      ? 'bg-frost-cyan/60 cursor-wait'
                      : 'bg-frost-cyan hover:bg-frost-cyan/90 hover:shadow-neon hover:-translate-y-0.5 active:scale-95 cursor-pointer',
                  ].join(' ')}
                >
                  {isConnecting ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-arctic-navy" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Connecting…
                    </span>
                  ) : (
                    'Launch App'
                  )}
                </button>

                <a
                  href="https://stellar.expert/explorer/testnet/contract/CBOROBVU4NXZOMFQUQSOOHD4JW6DTU4OPRV6AZYKHZJC3OCKU4KS7ZCN"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-4 rounded-xl border border-frost-cyan/30 text-frost-cyan text-lg font-medium
                             hover:bg-frost-cyan/5 hover:border-frost-cyan/60 hover:shadow-[0_0_20px_rgba(0,212,255,0.12)] transition-all duration-300"
                >
                  View Contract →
                </a>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-8 mt-8 text-center">
                {[
                  { value: 'USDC', label: 'Bond Currency' },
                  { value: '~5s', label: 'Slash Latency' },
                  { value: '0', label: 'Human Arbitration' },
                ].map((stat, idx) => (
                  <React.Fragment key={stat.label}>
                    {idx > 0 && <div className="w-px h-8 bg-frost-cyan/20" />}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.8 + idx * 0.15 }}
                      className="frost-stat-card !p-4 !rounded-lg"
                    >
                      <p className="text-2xl font-bold text-frost-gradient">{stat.value}</p>
                      <p className="text-xs text-frost-gray mt-1">{stat.label}</p>
                    </motion.div>
                  </React.Fragment>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ═══════════════ SECTION DIVIDER ═══════════════ */}
          <div className="relative z-10 flex justify-center py-2" aria-hidden="true">
            <div
              className="w-48 h-px"
              style={{ background: 'linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.4), transparent)' }}
            />
          </div>

          {/* ═══════════════ FEATURES SECTION ═══════════════ */}
          <section id="features" className="relative z-10 px-6 py-24">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-5xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-frost-white text-center mb-4">
                What is OmniCold?
              </h2>
              <p className="text-frost-gray text-center max-w-2xl mx-auto mb-12 leading-relaxed">
                OmniCold solves the cold-chain accountability problem in pharmaceutical logistics. 
                When temperature-sensitive cargo is transported, logistics providers post a USDC bond. 
                If IoT sensors detect a temperature breach, the bond is automatically slashed — no claims, 
                no disputes, no waiting.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    icon: <LockIcon size={24} className="text-frost-cyan" />,
                    title: 'Trustless Escrow',
                    desc: 'USDC bonds are held in a Soroban smart contract. No intermediary controls the funds — only the contract logic can release or slash them.',
                  },
                  {
                    icon: <ZapIcon size={24} className="text-frost-cyan" />,
                    title: 'Instant Enforcement',
                    desc: 'When an IoT oracle reports a temperature breach, the bond is atomically transferred to the shipper in the same transaction. No delays, no appeals.',
                  },
                  {
                    icon: <CheckCircleIcon size={24} className="text-frost-cyan" />,
                    title: 'On-Chain Audit Trail',
                    desc: 'Every temperature reading, state transition, and fund movement is recorded immutably on the Stellar blockchain. Full transparency for all parties.',
                  },
                ].map((feature, idx) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.15 }}
                    className="rounded-xl border border-frost-cyan/15 bg-arctic-slate/40 backdrop-blur-sm p-6 flex flex-col gap-4
                               hover:border-frost-cyan/30 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] transition-all duration-300"
                  >
                    <div className="bg-frost-cyan/10 rounded-full p-3 w-fit">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-frost-white">{feature.title}</h3>
                    <p className="text-sm text-frost-gray leading-relaxed">
                      {feature.desc}
                    </p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ═══════════════ HOW IT WORKS ═══════════════ */}
          <section id="how-it-works" className="relative z-10 px-6 py-24">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-frost-white text-center mb-12">
                How It Works
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { step: '01', title: 'Create Shipment', desc: 'Shipper sets temperature thresholds and bond amount' },
                  { step: '02', title: 'Deposit Bond', desc: 'Logistics provider locks USDC into the escrow contract' },
                  { step: '03', title: 'Monitor Temps', desc: 'IoT oracle reports temperature readings on-chain' },
                  { step: '04', title: 'Auto-Enforce', desc: 'Breach? Bond slashed. Delivered? Bond returned.' },
                ].map((item, idx) => (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: idx * 0.1 }}
                    className="flex flex-col items-center text-center gap-3"
                  >
                    <span className="text-3xl font-bold text-frost-cyan/30">{item.step}</span>
                    <h3 className="text-base font-semibold text-frost-white">{item.title}</h3>
                    <p className="text-sm text-frost-gray leading-relaxed">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ═══════════════ ROLE CARDS ═══════════════ */}
          <section id="roles" className="relative z-10 px-6 pb-24">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center gap-8 max-w-4xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-frost-white text-center">
                Built for Every Role
              </h2>
              <p className="text-frost-gray text-center max-w-xl">
                Whether you ship pharmaceuticals, transport cold cargo, or manage IoT sensors — 
                OmniCold gives you the tools for your role.
              </p>
              <RoleCards />
            </motion.div>
          </section>

          {/* ═══════════════ FAQ SECTION ═══════════════ */}
          <section id="faq" className="relative z-10 px-6 py-24">
            <motion.div
              initial={prefersReduced ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl mx-auto"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-frost-white text-center mb-12">
                Frequently Asked Questions
              </h2>

              <div className="flex flex-col gap-4">
                {[
                  {
                    q: 'What blockchain does OmniCold use?',
                    a: 'OmniCold is built on Stellar using Soroban smart contracts. Stellar provides fast finality (~5 seconds), low fees, and native USDC support via the Stellar Asset Contract.',
                  },
                  {
                    q: 'How does the temperature monitoring work?',
                    a: 'An authorized IoT oracle address reports temperature readings on-chain. When a reading exceeds the configured thresholds, the smart contract automatically transfers the full bond from escrow to the shipper.',
                  },
                  {
                    q: 'What happens if the delivery is successful?',
                    a: 'If the cargo arrives within temperature range, the shipper confirms delivery and the full USDC bond is released back to the logistics provider. No penalty is applied.',
                  },
                  {
                    q: 'Can the bond be partially slashed?',
                    a: 'No. OmniCold uses a full-bond slashing model for simplicity and clarity. The entire bond is either held, released, or slashed. This eliminates ambiguity.',
                  },
                  {
                    q: 'Do I need a Stellar wallet?',
                    a: 'Yes. You need the Freighter browser extension to sign transactions. Freighter is a free Stellar wallet that manages your keys securely in the browser.',
                  },
                  {
                    q: 'Is OmniCold audited?',
                    a: 'OmniCold is currently deployed on Stellar Testnet. The smart contract includes 12 automated tests (5 unit + 7 property-based) covering all state transitions and edge cases.',
                  },
                ].map((faq, idx) => (
                  <motion.details
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.3, delay: idx * 0.08 }}
                    className="group rounded-xl border border-frost-cyan/15 bg-arctic-slate/30 backdrop-blur-sm"
                  >
                    <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-frost-white font-medium text-sm list-none select-none">
                      <span>{faq.q}</span>
                      <svg
                        className="w-4 h-4 text-frost-cyan shrink-0 transition-transform duration-200 group-open:rotate-180"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </summary>
                    <div className="px-6 pb-4 text-sm text-frost-gray leading-relaxed">
                      {faq.a}
                    </div>
                  </motion.details>
                ))}
              </div>
            </motion.div>
          </section>

          {/* ═══════════════ FOOTER ═══════════════ */}
          <footer className="relative z-10 border-t border-frost-cyan/10 bg-arctic-deep/40 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6 py-12">
              {/* Footer grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                {/* Brand column */}
                <div className="flex flex-col gap-3 md:col-span-2">
                  <div className="flex items-center gap-2">
                    <SnowflakeIcon className="text-frost-cyan w-5 h-5" />
                    <span className="text-lg font-bold text-frost-white">OmniCold</span>
                  </div>
                  <p className="text-sm text-frost-gray leading-relaxed max-w-sm">
                    Trustless cold-chain escrow powered by Stellar Soroban. Automated penalty 
                    enforcement for pharmaceutical logistics with zero human intervention.
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="w-2 h-2 rounded-full bg-status-safe animate-pulse" />
                    <span className="text-xs text-status-safe font-medium">Live on Testnet</span>
                  </div>
                </div>

                {/* Links column */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-frost-gray">Resources</h4>
                  <a href="#features" className="text-sm text-frost-gray hover:text-frost-cyan transition-colors">Features</a>
                  <a href="#how-it-works" className="text-sm text-frost-gray hover:text-frost-cyan transition-colors">How It Works</a>
                  <a href="#faq" className="text-sm text-frost-gray hover:text-frost-cyan transition-colors">FAQ</a>
                  <a href="https://www.freighter.app/" target="_blank" rel="noopener noreferrer" className="text-sm text-frost-gray hover:text-frost-cyan transition-colors">
                    Get Freighter Wallet
                  </a>
                </div>

                {/* External links column */}
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-frost-gray">Explore</h4>
                  <a href="https://stellar.expert/explorer/testnet/contract/CBOROBVU4NXZOMFQUQSOOHD4JW6DTU4OPRV6AZYKHZJC3OCKU4KS7ZCN" target="_blank" rel="noopener noreferrer" className="text-sm text-frost-gray hover:text-frost-cyan transition-colors">
                    Contract on StellarExpert
                  </a>
                  <a href="https://soroban.stellar.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-frost-gray hover:text-frost-cyan transition-colors">
                    Soroban Docs
                  </a>
                  <a href="https://stellar.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-frost-gray hover:text-frost-cyan transition-colors">
                    Stellar.org
                  </a>
                  <a href="https://horizon-testnet.stellar.org/" target="_blank" rel="noopener noreferrer" className="text-sm text-frost-gray hover:text-frost-cyan transition-colors">
                    Horizon API
                  </a>
                </div>
              </div>

              {/* Bottom bar */}
              <div className="border-t border-frost-cyan/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-xs text-frost-gray">
                  © 2026 OmniCold. Built on Stellar. MIT License.
                </p>
                <div className="flex items-center gap-4 text-xs text-frost-gray">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-frost-cyan" />
                    Stellar Testnet
                  </span>
                  <span>•</span>
                  <span>Soroban SDK 22.0.0</span>
                  <span>•</span>
                  <span>USDC Escrow</span>
                </div>
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LandingHero;

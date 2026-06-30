import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/hero/Hero";
import IntroPreloader from "@/components/hero/IntroPreloader";
import About from "@/components/sections/About";
import Showcase from "@/components/sections/Showcase";
import Services from "@/components/sections/Services";
import Gallery from "@/components/sections/Gallery";
import Process from "@/components/sections/Process";
import Why from "@/components/sections/Why";
import Reviews from "@/components/sections/Reviews";
import ChatWidget from "@/components/chat/ChatWidget";
import AdminPanel from "@/components/chat/AdminPanel";

export default function Home() {
  return (
    <div id="top" className="relative">
      <IntroPreloader />
      <Nav />
      <main>
        <Hero />
        <About />
        <Showcase />
        <Services />
        <Gallery />
        <Process />
        <Why />
        <Reviews />
      </main>
      <Footer />

      {/* Floating + overlay UI (read open-state from the UI context) */}
      <ChatWidget />
      <AdminPanel />
    </div>
  );
}

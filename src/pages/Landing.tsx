import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import NavBar from "@/components/NavBar";

const Landing = () => {
  return (
    <main className="min-h-screen w-full bg-primary text-primary-foreground flex flex-col">
      <NavBar />
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight max-w-4xl leading-[0.95]"
        >
          Kavak Service & Warranty Contract Agreement
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-12"
        >
          <Link
            to="/report"
            className="group inline-flex items-center gap-3 bg-white text-primary rounded-full px-8 md:px-10 py-4 md:py-5 text-lg md:text-xl font-bold hover:bg-white/90 transition-all hover:gap-4 shadow-2xl"
          >
            Begin Agreement
            <ArrowRight className="h-5 w-5 md:h-6 md:w-6 transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </section>

    </main>
  );
};

export default Landing;

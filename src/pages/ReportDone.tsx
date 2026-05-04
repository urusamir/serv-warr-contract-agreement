import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import logoWhite from "@/assets/kavak-logo-white-transparent.png";

const ReportDone = () => {
  return (
    <main className="min-h-screen w-full bg-black text-white flex flex-col">
      <header className="p-6 md:p-10">
        <img src={logoWhite} alt="Kavak" className="h-7 md:h-9 w-auto" />
      </header>
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <CheckCircle2 className="h-20 w-20 md:h-24 md:w-24 text-primary mx-auto" strokeWidth={1.5} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 text-4xl md:text-6xl font-black tracking-tight"
        >
          Report submitted
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-4 text-lg md:text-xl text-white/70 max-w-md"
        >
          Your service report has been sent successfully.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 flex gap-4"
        >
          <Link
            to="/report"
            className="bg-primary text-primary-foreground rounded-full px-7 py-3.5 font-semibold hover:opacity-90 transition"
          >
            Start new report
          </Link>
          <Link
            to="/"
            className="bg-white/10 text-white rounded-full px-7 py-3.5 font-semibold hover:bg-white/20 transition"
          >
            Home
          </Link>
        </motion.div>
      </section>
    </main>
  );
};

export default ReportDone;

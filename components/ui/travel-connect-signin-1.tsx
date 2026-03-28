import React, { useRef, useEffect, useState } from "react";
import { Eye, EyeOff, ArrowRight, Building2, Landmark, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Helper function to merge class names
const cn = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

// Custom Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}

const Button = ({ 
  children, 
  variant = "default", 
  className = "", 
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantStyles = {
    default: "bg-primary bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
}

const Input = ({ className = "", ...props }: InputProps) => {
  return (
    <input
      className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm text-gray-800 ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
};

type RoutePoint = {
  x: number;
  y: number;
  delay: number;
};

const DotMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Set up routes that will animate across the map (representing data flows)
  const routes: { start: RoutePoint; end: RoutePoint; color: string }[] = [
    {
      start: { x: 100, y: 150, delay: 0 },
      end: { x: 200, y: 80, delay: 2 },
      color: "#2563eb",
    },
    {
      start: { x: 200, y: 80, delay: 2 },
      end: { x: 260, y: 120, delay: 4 },
      color: "#2563eb",
    },
    {
      start: { x: 50, y: 50, delay: 1 },
      end: { x: 150, y: 180, delay: 3 },
      color: "#2563eb",
    },
    {
      start: { x: 280, y: 60, delay: 0.5 },
      end: { x: 180, y: 180, delay: 2.5 },
      color: "#2563eb",
    },
  ];

  // Create dots for the map (can represent local regions or general network)
  const generateDots = (width: number, height: number) => {
    const dots = [];
    const gap = 14;
    const dotRadius = 1;

    for (let x = 0; x < width; x += gap) {
      for (let y = 0; y < height; y += gap) {
        // Just a nice abstract grid for budgeting/enterprise feel
        if (Math.random() > 0.4) {
          dots.push({
            x,
            y,
            radius: dotRadius,
            opacity: Math.random() * 0.4 + 0.1,
          });
        }
      }
    }
    return dots;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(entries => {
      if (!entries[0]) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({ width, height });
      canvas.width = width;
      canvas.height = height;
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots = generateDots(dimensions.width, dimensions.height);
    let animationFrameId: number;
    let startTime = Date.now();

    const drawDots = (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);
      dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(37, 99, 235, ${dot.opacity})`;
        ctx.fill();
      });
    };

    const drawRoutes = (ctx: CanvasRenderingContext2D) => {
      const currentTime = (Date.now() - startTime) / 1000;
      routes.forEach(route => {
        const elapsed = currentTime - route.start.delay;
        if (elapsed <= 0) return;
        const duration = 4;
        const progress = Math.min(elapsed / duration, 1);
        const x = route.start.x + (route.end.x - route.start.x) * progress;
        const y = route.start.y + (route.end.y - route.start.y) * progress;
        
        ctx.beginPath();
        ctx.moveTo(route.start.x, route.start.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = `rgba(37, 99, 235, ${0.4 - progress * 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fillStyle = "#3b82f6";
        ctx.fill();
        
        if (progress === 1 && Math.random() > 0.99) {
           // Small pulse on finish
        }
      });
    };
    
    const animate = () => {
      if (!ctx) return;
      drawDots(ctx);
      drawRoutes(ctx);
      const currentTime = (Date.now() - startTime) / 1000;
      if (currentTime > 10) startTime = Date.now();
      animationFrameId = requestAnimationFrame(animate);
    };
    
    animate();
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};

export interface SignInCardProps {
  email?: string;
  setEmail?: (value: string) => void;
  password?: string;
  setPassword?: (value: string) => void;
  onSubmit?: (e: React.FormEvent) => void;
  isLoading?: boolean;
  error?: string | null;
}

const SignInCard = ({
  email: propEmail,
  setEmail: propSetEmail,
  password: propPassword,
  setPassword: propSetPassword,
  onSubmit,
  isLoading = false,
  error
}: SignInCardProps) => {
  const [internalEmail, setInternalEmail] = useState("");
  const [internalPassword, setInternalPassword] = useState("");
  
  const email = propEmail !== undefined ? propEmail : internalEmail;
  const setEmail = propSetEmail || setInternalEmail;
  
  const password = propPassword !== undefined ? propPassword : internalPassword;
  const setPassword = propSetPassword || setInternalPassword;
  
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div className="flex w-full h-full items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl overflow-hidden rounded-2xl flex bg-white shadow-xl"
      >
        {/* Left side - Information Panel */}
        <div className="hidden md:block w-1/2 h-[600px] relative overflow-hidden border-r border-gray-100">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <DotMap />
            
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-10">
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mb-8"
              >
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-200">
                  <Building2 className="text-white h-10 w-10" />
                </div>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-4xl font-bold mb-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-800"
              >
                E-Budgeting
              </motion.h2>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="space-y-4 text-center"
              >
                <p className="text-gray-600 font-medium max-w-xs mx-auto">
                  Sistem Informasi Penganggaran Daerah yang Transparan dan Akuntabel
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-blue-600 bg-blue-100/50 py-1 px-3 rounded-full">
                  <ShieldCheck size={14} />
                  <span>Sistem Keamanan Terenkripsi</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        
        {/* Right side - Sign In Form */}
        <div className="w-full md:w-1/2 p-10 md:p-12 flex flex-col justify-center bg-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl font-bold mb-2 text-gray-800">Masuk ke Akun</h1>
            <p className="text-gray-500 mb-10">Masukkan email dan password untuk mengakses sistem</p>
            
            <form className="space-y-6" onSubmit={onSubmit || ((e) => e.preventDefault())}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email <span className="text-blue-600">*</span>
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@instansi.go.id"
                  required
                  disabled={isLoading}
                  className="bg-gray-50/50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full focus:border-blue-600 focus:ring-blue-600 h-11"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password <span className="text-blue-600">*</span>
                  </label>
                  <a href="#" className="text-xs text-blue-600 hover:text-blue-700">Lupa password?</a>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={isPasswordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    disabled={isLoading}
                    className="bg-gray-50/50 border-gray-200 placeholder:text-gray-400 text-gray-800 w-full pr-10 focus:border-blue-600 focus:ring-blue-600 h-11"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  >
                    {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-red-600 text-sm bg-red-50 p-4 rounded-lg border border-red-100 flex gap-2 items-start"
                >
                  <div className="mt-0.5">⚠️</div>
                  <div>{error}</div>
                </motion.div>
              )}
              
              <motion.div 
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onHoverStart={() => setIsHovered(true)}
                onHoverEnd={() => setIsHovered(false)}
                className="pt-4"
              >
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full h-12 relative overflow-hidden transition-all duration-300 rounded-xl font-semibold shadow-lg",
                    isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-blue-200"
                  )}
                  onClick={(e) => {
                    if (onSubmit) {
                      onSubmit(e);
                    } else {
                      e.preventDefault();
                    }
                  }}
                >
                  <span className="flex items-center justify-center gap-2">
                    {isLoading ? "Memproses..." : "Masuk"}
                    {!isLoading && <ArrowRight className="h-4 w-4" />}
                  </span>
                  {isHovered && !isLoading && (
                    <motion.span
                      initial={{ left: "-100%" }}
                      animate={{ left: "100%" }}
                      transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                      className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      style={{ filter: "blur(12px)" }}
                    />
                  )}
                </Button>
              </motion.div>
              
              <div className="text-center mt-8 text-sm text-gray-500">
                Belum punya akun? <a href="/auth/sign-up" className="text-blue-600 font-semibold hover:underline">Daftar sekarang</a>
              </div>
            </form>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignInCard;

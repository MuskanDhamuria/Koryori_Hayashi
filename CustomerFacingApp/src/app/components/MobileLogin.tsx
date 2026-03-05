import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { UtensilsCrossed, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { CherryBlossom } from "./JapanesePattern";

interface MobileLoginProps {
  onLogin: (phoneNumber: string) => void;
}

export function MobileLogin({ onLogin }: MobileLoginProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    
    setTimeout(() => {
      toast.success("Welcome back!");
      onLogin(phoneNumber);
      setIsLoading(false);
    }, 1000);
  };

  const handleQuickLogin = (number: string) => {
    setPhoneNumber(number);
  };

  return (
    <div className="min-h-screen bg-[#E8DCC8] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle sage green glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-96 h-96 bg-[#7C8A7A]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-20 w-80 h-80 bg-[#9BA89A]/10 rounded-full blur-3xl" />
      </div>

      {/* Floating Cherry Blossoms */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <CherryBlossom className="absolute top-20 left-10 animate-float opacity-20" size={40} />
        <CherryBlossom className="absolute top-40 right-20 animate-float-delayed opacity-15" size={30} />
        <CherryBlossom className="absolute bottom-32 left-1/4 animate-float opacity-18" size={35} />
        <CherryBlossom className="absolute top-1/3 right-1/3 animate-float-delayed opacity-12" size={25} />
        <CherryBlossom className="absolute bottom-20 right-10 animate-float opacity-25" size={45} />
      </div>

      <Card className="w-full max-w-md relative bg-[#F5F0E8]/95 backdrop-blur-sm border border-[#7C8A7A]/20 shadow-2xl overflow-hidden">
        {/* Top sage accent */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#7C8A7A] to-transparent opacity-60" />
        
        <div className="p-8">
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#7C8A7A] to-[#9BA89A] rounded-full flex items-center justify-center shadow-lg relative">
                <UtensilsCrossed className="w-12 h-12 text-[#F5F0E8]" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-t from-transparent to-white/20" />
                <CherryBlossom className="absolute -top-2 -right-2 opacity-80" size={32} />
              </div>
            </div>
            
            <h1 className="text-5xl font-bold mb-3 text-[#4A5548]" style={{ fontFamily: 'serif' }}>
              Koryori Hayashi

            </h1>
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#7C8A7A]/40" />
              <h2 className="text-xl tracking-widest text-[#5A6558]">Authentic Japanese Cuisine</h2>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#7C8A7A]/40" />
            </div>
            <p className="text-[#6B7669] text-sm"></p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-semibold text-[#4A5548] block">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7C8A7A]" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-11 h-12 bg-white/60 border-2 border-[#7C8A7A]/30 focus:border-[#7C8A7A] focus:ring-[#7C8A7A] text-[#4A5548] placeholder:text-[#9BA89A]"
                />
              </div>
              <p className="text-xs text-[#6B7669]">
                We'll send you a verification code
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#7C8A7A] to-[#9BA89A] hover:from-[#6B7969] hover:to-[#8A9889] text-white shadow-lg text-base font-semibold"
            >
              {isLoading ? (
                "Signing in..."
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#7C8A7A]/20" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-[#F5F0E8] px-4 text-xs uppercase tracking-wider text-[#6B7669]">Quick Access</span>
            </div>
          </div>

          {/* Quick Login Options */}
          <div className="space-y-3">
            <p className="text-sm text-[#6B7669] text-center mb-3">
              Demo accounts for testing:
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-[#7C8A7A]/30 hover:bg-[#7C8A7A]/10 hover:border-[#7C8A7A]/50 transition-all bg-white/40 text-[#4A5548]"
              onClick={() => handleQuickLogin("+1 (555) 123-4567")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌸</span>
                  <span className="font-medium">Yuki Tanaka</span>
                  <span className="text-xs px-2 py-0.5 bg-[#C5A572]/30 text-[#8B6F47] rounded-full border border-[#C5A572]/40">Gold</span>
                </div>
                <span className="text-xs text-[#6B7669]">850 pts</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-[#7C8A7A]/30 hover:bg-[#7C8A7A]/10 hover:border-[#7C8A7A]/50 transition-all bg-white/40 text-[#4A5548]"
              onClick={() => handleQuickLogin("+1 (555) 987-6543")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💎</span>
                  <span className="font-medium">Akira Sato</span>
                  <span className="text-xs px-2 py-0.5 bg-purple-900/20 text-purple-800 rounded-full border border-purple-700/30">Platinum</span>
                </div>
                <span className="text-xs text-[#6B7669]">2100 pts</span>
              </div>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full border-2 border-[#7C8A7A]/30 hover:bg-[#7C8A7A]/10 hover:border-[#7C8A7A]/50 transition-all bg-white/40 text-[#4A5548]"
              onClick={() => handleQuickLogin("+1 (555) 555-5555")}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏮</span>
                  <span className="font-medium">New Customer</span>
                  <span className="text-xs px-2 py-0.5 bg-[#9BA89A]/20 text-[#5A6558] rounded-full border border-[#7C8A7A]/30">Silver</span>
                </div>
                <span className="text-xs text-[#6B7669]">0 pts</span>
              </div>
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#7C8A7A]/20">
            <p className="text-xs text-center text-[#6B7669]">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>

        {/* Decorative corner glow */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#7C8A7A]/10 to-transparent rounded-bl-full" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-[#9BA89A]/10 to-transparent rounded-tr-full" />
      </Card>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-25px) rotate(-5deg); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

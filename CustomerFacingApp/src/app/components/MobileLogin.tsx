import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { UtensilsCrossed, Phone, ArrowRight } from "lucide-react";
import { toast } from "sonner";

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
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] via-[#0F1729] to-[#1A2642] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="fixed inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(#D4AF37 1px, transparent 1px), linear-gradient(90deg, #D4AF37 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      <Card className="w-full max-w-md relative bg-white shadow-2xl">
        <div className="p-10">
          {/* Logo & Header */}
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#0F1729] to-[#2D3E5F] rounded-full flex items-center justify-center shadow-lg">
                <UtensilsCrossed className="w-8 h-8 text-[#D4AF37]" strokeWidth={2} />
              </div>
            </div>
            
            <h1 className="text-4xl font-bold text-[#0F1729] mb-2 tracking-tight">
              Koryori Hayashi
            </h1>
            <div className="flex items-center justify-center gap-2 text-sm text-[#6B7280]">
              <span>Welcome!</span>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-[#0F1729]">
                Mobile Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#6B7280]" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="pl-11 h-12 border-2 border-[#E5E7EB] focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#0F1729] hover:bg-[#1A2642] text-white shadow-md transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E7EB]" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-4 text-xs text-[#6B7280] uppercase">
                Quick Access
              </span>
            </div>
          </div>

          {/* Quick Login Options */}
          <div className="space-y-3">
            
            
               <Button
  type="button"
  variant="outline"
  className="w-full h-auto py-3 px-2 sm:px-3 border-2 hover:bg-[#E5E7EB] transition-all"
  onClick={() => handleQuickLogin("+1 (555) 123-4567")}
>
  <div className="flex items-center justify-between w-full gap-1 sm:gap-2">
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#E8C95A]/20 to-[#D4AF37]/20 flex items-center justify-center shrink-0">
        <span className="text-base sm:text-lg">⭐</span>
      </div>
      <div className="text-left min-w-0">
        <div className="font-semibold text-xs sm:text-sm text-[#0F1729] truncate">Yuki Tanaka</div>
        <div className="text-[10px] sm:text-xs text-[#6B7280] truncate">+1 (555) 123-4567</div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 sm:gap-1 shrink-0">
  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#D4AF37] text-white rounded font-semibold whitespace-nowrap">
    Gold
  </span>
  <span className="text-[10px] sm:text-xs text-[#6B7280] whitespace-nowrap">
    850 pts
  </span>
</div>
  </div>
</Button>
          
             <Button
  type="button"
  variant="outline"
  className="w-full h-auto py-3 px-2 sm:px-3 border-2 hover:bg-[#E5E7EB] transition-all"
  onClick={() => handleQuickLogin("+1 (555) 987-6543")}
>
  <div className="flex items-center justify-between w-full gap-1 sm:gap-2">
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#D4AF37]/30 to-[#B8952B]/30 flex items-center justify-center shrink-0">
        <span className="text-base sm:text-lg">💎</span>
      </div>
      <div className="text-left min-w-0">
        <div className="font-semibold text-xs sm:text-sm text-[#0F1729] truncate">Akira Sato</div>
        <div className="text-[10px] sm:text-xs text-[#6B7280] truncate">+1 (555) 987-6543</div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 sm:gap-1 shrink-0">
  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#F3F4F6] text-[#6B7280] rounded font-semibold whitespace-nowrap">
    Silver
  </span>
  <span className="text-[10px] sm:text-xs text-[#6B7280] whitespace-nowrap">
    500 pts
  </span>
</div>
  </div>
</Button>

<Button
  type="button"
  variant="outline"
  className="w-full h-auto py-3 px-2 sm:px-3 border-2 hover:bg-[#E5E7EB] transition-all"
  onClick={() => handleQuickLogin("+1 (555) 555-5555")}
>
  <div className="flex items-center justify-between w-full gap-1 sm:gap-2">
    <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#F3F4F6] flex items-center justify-center shrink-0">
        <span className="text-base sm:text-lg">🌸</span>
      </div>
      <div className="text-left min-w-0">
        <div className="font-semibold text-xs sm:text-sm text-[#0F1729] truncate">New Customer</div>
        <div className="text-[10px] sm:text-xs text-[#6B7280] truncate">+1 (555) 555-5555</div>
      </div>
    </div>
    <div className="flex flex-col items-end gap-1 sm:gap-1 shrink-0">
  <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 bg-[#0F1729] text-[#D4AF37] rounded font-semibold whitespace-nowrap">
    Platinum
  </span>
  <span className="text-[10px] sm:text-xs text-[#6B7280] whitespace-nowrap">
    2100 pts
  </span>
</div>
  </div>
</Button>
            
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
            <p className="text-xs text-center text-[#6B7280]">
              By continuing, you agree to our <span className="text-[#0F1729] font-medium">Terms</span> and <span className="text-[#0F1729] font-medium">Privacy Policy</span>
            </p>
          </div>
        </div>

      </Card>
    </div>
  );
}
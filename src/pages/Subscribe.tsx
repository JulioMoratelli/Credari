import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, CheckCircle2 } from "lucide-react"

export default function Subscribe() {
  const plans = [
    // {
    //   name: "Start",
    //   monthly: "R$ 9,00",
    //   yearly: "R$ 96,00",
    //   features: [
    //     "Controle financeiro básico",
    //     "Cadastro de receitas e despesas",
    //     "Metas simples",
    //   ],
    //   links: {
    //     monthly: "https://pay.kirvano.com/023ce88e-7c4f-4d38-98b3-2cb07c3bfce3",
    //     yearly: "https://pay.kirvano.com/f4c559df-8e23-455c-a908-269b60ae27bf",
    //   },
    //   highlight: false,
    // },
    {
      name: "Premium",
      monthly: "R$ 19,00",
      yearly: "R$ 216,00",
      features: [
        "Tudo do Start",
        "Insights inteligentes com IA",
        "Relatórios avançados",
        "Lançamento automatizado via WhatsApp",
      ],
      links: {
        monthly: "https://pay.kirvano.com/fb62d656-6806-4bd5-819d-0274a5b84690",
        yearly: "https://pay.kirvano.com/73a32052-ea95-4a00-9571-69497284d0be",
      },
      highlight: true,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center space-y-3">
        <h1 className="text-2xl md:text-3xl font-bold gradient-bg bg-clip-text text-transparent">
          Escolha seu Plano
        </h1>
        <p className="text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Tenha controle total das suas finanças com o Credari
        </p>
      </div>

      {/* Planos */}
      <div className="grid md:grid-cols-1 gap-6 max-w-5xl mx-auto">
        {plans.map((plan) => (
          <Card
            key={plan.name}
            className={`rounded-2xl transition-all shadow hover:shadow-lg hover:scale-[1.02] ${plan.highlight ? "border-2 border-primary" : "border"
              }`}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{plan.name}</span>
                {plan.highlight && (
                  <Badge className="bg-primary text-white">Mais Popular</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mensal */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Mensal</p>
                <p className="text-2xl font-bold text-primary">{plan.monthly}</p>
                <Button
                  asChild
                  className="w-full gradient-bg text-white hover:opacity-90"
                >
                  <a href={plan.links.monthly} target="_blank" rel="noopener noreferrer">
                    Assinar Mensal
                  </a>
                </Button>
              </div>

              {/* Anual */}
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Anual</p>
                <p className="text-2xl font-bold text-primary">{plan.yearly}</p>
                <p className="text-sm text-muted-foreground">À vista</p>
                <Button
                  asChild
                  className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90"
                >
                  <a href={plan.links.yearly} target="_blank" rel="noopener noreferrer">
                    Assinar Anual
                  </a>
                </Button>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { DollarSign, TrendingUp, Shield, BarChart3, ArrowRight, CheckCircle, Goal, Brain, MessageCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

const Home = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3 h-10 overflow-hidden">
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/public/escrito-branco.png"
                alt="Logo Credari"
                className="h-full w-32 object-cover"
              />
            </Link>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex">Login</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">
                <span className="hidden sm:inline">Criar Conta</span>
                <span className="sm:hidden">Entrar</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent leading-tight">
            Gestão Financeira Inteligente e Automática
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto px-4">
            Organize suas contas, registre receitas e despesas, defina metas e use nossa Inteligência Artificial para identificar onde economizar. Tudo em uma única plataforma moderna, segura e integrada ao WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link to="/auth" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Criar Conta Grátis
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Ver Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16 px-4">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Tudo que você precisa em um só lugar</h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              A Credari foi desenvolvida para simplificar e automatizar a forma como você cuida do seu dinheiro.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <Card>
              <CardHeader>
                <DollarSign className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Lançamentos de Receitas e Despesas</CardTitle>
                <CardDescription>
                  Registre movimentações de forma simples e rápida, categorizando automaticamente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Controle total de entradas e saídas</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Filtros avançados</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Histórico detalhado</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Cadastro de Contas Bancárias</CardTitle>
                <CardDescription>
                  Concentre todas as suas contas em um só painel.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Saldo em tempo real</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Multibanco</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Integração simplificada</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Goal className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Definição de Metas</CardTitle>
                <CardDescription>
                  Estabeleça objetivos financeiros e acompanhe seu progresso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Metas personalizadas</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Alertas inteligentes</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Progresso visual</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-12 w-12 text-primary mb-4" />
                <CardTitle>IA para Economia</CardTitle>
                <CardDescription>
                  Nossa Inteligência Artificial identifica onde você pode economizar.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Sugestões personalizadas</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Análise de hábitos de consumo</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Economia otimizada</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Lançamentos via WhatsApp</CardTitle>
                <CardDescription>
                  Registre receitas e despesas enviando mensagens para o WhatsApp da Credari.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Automação completa</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Integração rápida</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Praticidade total</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Relatórios e Insights</CardTitle>
                <CardDescription>
                  Visualize suas finanças com dashboards e gráficos interativos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Análise de tendências</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Dashboard intuitivo</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Relatórios exportáveis</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Planos e Valores</h2>
          <p className="text-base sm:text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Escolha o plano ideal para o seu momento e aproveite todos os recursos da Credari.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>Start</CardTitle>
                <CardDescription>Para começar a organizar suas finanças</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold">R$ 9/mês</p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Cadastro de contas</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Lançamentos de Receitas e Despesas</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Relatórios</li>
                </ul>
                {/* <Link to="/auth">
                  <Button className="w-full">Começar Grátis</Button>
                </Link> */}
              </CardContent>
            </Card>

            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle>Premium</CardTitle>
                <CardDescription>Para quem deseja o máximo em automação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-3xl font-bold">R$ 19/mês</p>
                <ul className="space-y-2 text-left">
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Tudo do Grátis</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />IA para economia</li>
                  <li className="flex items-center"><CheckCircle className="h-4 w-4 text-primary mr-2" />Lançamentos via WhatsApp</li>
                </ul>
                {/* <Link to="/auth">
                  <Button className="w-full">Assinar Premium</Button>
                </Link> */}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-2xl mx-auto px-4">
            <Shield className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Segurança em Primeiro Lugar</h2>
            <p className="text-base sm:text-lg text-muted-foreground mb-8">
              A Credari segue as melhores práticas de segurança digital para manter seus dados sempre protegidos. Comece agora mesmo a organizar suas finanças com tecnologia de ponta.
            </p>
            <Link to="/auth" className="inline-block w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto">
                Criar Minha Conta Grátis
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <DollarSign className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Credari</span>
          </div>
          <p className="text-muted-foreground mb-2">
            © 2024 Credari. Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Credari é a plataforma completa de gestão financeira pessoal com lançamentos via WhatsApp, Inteligência Artificial para economia, metas financeiras e relatórios inteligentes.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
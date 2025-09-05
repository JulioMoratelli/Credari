import express from "express";
import bodyParser from "body-parser";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(bodyParser.json());

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ precisa ser a service key (não a public)
);

const KIRVANO_SECRET = process.env.KIRVANO_SECRET || "";

app.post("/api/webhooks/kirvano", async (req, res) => {
  const token = req.headers["x-webhook-token"];
  if (KIRVANO_SECRET && token !== KIRVANO_SECRET) {
    return res.status(401).send("Unauthorized");
  }

  const { event, data } = req.body;

  try {
    const userId = data.user_id; // mapeie de acordo com o payload real da Kirvano
    const plan = data.plan_key?.includes("premium") ? "premium" : "start";
    const billingCycle = data.plan_key?.includes("year") ? "yearly" : "monthly";

    if (!userId) {
      throw new Error("Payload sem user_id");
    }

    // Buscar assinatura ativa do usuário
    const { data: subs } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(1);

    const activeSub = subs?.[0];

    if (event === "purchase.approved" || event === "subscription.renewed") {
      // Se já existe, apenas atualiza a data de término
      if (activeSub) {
        await supabase
          .from("subscriptions")
          .update({
            end_date: calculateEndDate(billingCycle),
            updated_at: new Date(),
          })
          .eq("id", activeSub.id);
      } else {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan,
          billing_cycle: billingCycle,
          status: "active",
          start_date: new Date(),
          end_date: calculateEndDate(billingCycle),
        });
      }
    }

    if (event === "subscription.canceled") {
      if (activeSub) {
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date() })
          .eq("id", activeSub.id);
      }
    }

    return res.status(200).send("OK");
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    return res.status(500).send("Internal Server Error");
  }
});

// Função auxiliar para calcular fim da assinatura
function calculateEndDate(billingCycle: string) {
  const d = new Date();
  if (billingCycle === "yearly") {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }
  return d.toISOString();
}

export default app;

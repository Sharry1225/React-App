import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTaskEmail(to, taskTitle, assignerName) {
  try {
    await resend.emails.send({
      from: "Antraajaal <notifications@send.antraajaal.com>",
      to,
      subject: `New task assigned: ${taskTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 480px;">
          <h2>You've got a new task</h2>
          <p><b>${assignerName}</b> assigned you a task in Antraajaal:</p>
          <p style="font-size:18px; padding:12px; background:#f4f4f4; border-radius:8px;">${taskTitle}</p>
          <p>Log in to your workspace to view and update it.</p>
        </div>
      `,
    });
    console.log("📧 Task email sent to", to);
  } catch (err) {
    console.error("Email failed (task still saved):", err.message);
  }
}
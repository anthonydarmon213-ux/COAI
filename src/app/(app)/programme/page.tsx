import { redirect } from "next/navigation";

// Le programme est désormais scindé en 3 pages dédiées (voir /programme/entrainement,
// /programme/alimentation, /programme/recuperation).
export default function ProgrammePage() {
  redirect("/programme/entrainement");
}

import { redirect } from "next/navigation";

// Le profil a été fusionné avec la page programme (voir /programme).
export default function ProfilPage() {
  redirect("/programme");
}

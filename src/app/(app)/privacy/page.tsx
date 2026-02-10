import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="px-4 py-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Zurück
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        Datenschutzerklärung
      </h1>

      <div className="prose prose-sm mt-6 max-w-none space-y-4 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-semibold">1. Verantwortlicher</h2>
          <p className="text-muted-foreground">
            Verantwortlich für die Datenverarbeitung auf dieser Plattform ist der
            Betreiber von findln. Kontaktdaten findest du im{" "}
            <Link href="/impressum" className="underline">
              Impressum
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">
            2. Welche Daten wir erheben
          </h2>
          <p className="text-muted-foreground">
            Bei der Registrierung erheben wir: Vorname, Nachname, E-Mail-Adresse,
            Wohnort, Postleitzahl und Telefonnummer. Optional kannst du ein
            Profilbild hochladen und Angaben zu deinen Kindern machen.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">
            3. Wofür wir deine Daten nutzen
          </h2>
          <p className="text-muted-foreground">
            Deine Daten werden ausschließlich für den Betrieb der Plattform
            verwendet: Profil anzeigen, Artikel einstellen und Reservierungen
            ermöglichen. Deine Telefonnummer wird nur bei einer Reservierung an
            den Käufer weitergegeben — und nur, wenn du dem bei der Anmeldung
            zugestimmt hast.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">4. Speicherung</h2>
          <p className="text-muted-foreground">
            Deine Daten werden in einer Supabase-Datenbank gespeichert (Hosting
            in der EU). Bilder werden in Supabase Storage abgelegt. Wir geben
            deine Daten nicht an Dritte weiter, außer wie in Punkt 3 beschrieben.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">5. Deine Rechte</h2>
          <p className="text-muted-foreground">
            Du hast das Recht auf Auskunft, Berichtigung und Löschung deiner
            Daten. Du kannst deinen Account jederzeit in den Profileinstellungen
            löschen — dabei werden alle deine Daten (Profil, Artikel,
            Reservierungen, Bilder) unwiderruflich entfernt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold">6. Cookies</h2>
          <p className="text-muted-foreground">
            Wir verwenden nur technisch notwendige Cookies für die
            Authentifizierung (Session-Cookies). Es werden keine Tracking- oder
            Marketing-Cookies eingesetzt.
          </p>
        </section>
      </div>
    </div>
  );
}

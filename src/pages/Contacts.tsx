import { Mail, MessageSquare, UserRound } from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

export default function Contacts() {
  const email = 'daniele.leo93@gmail.com'
  const subject = '[PhaRMA T] {tipo segnalazione} - {titolo}'
  const bodyTemplate = `Mittente:\n\n\nDescrizione:\n`
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`

  return (
    <div className="clinical-page max-w-5xl">
      <PageHeader
        title="Contatti e segnalazioni"
        description="Riferimenti per bug, malfunzionamenti, suggerimenti e richieste di modifica."
        icon={<Mail className="h-5 w-5" />}
      />

      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <UserRound className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Ideazione e sviluppo</h2>
                <p className="mt-3 leading-relaxed text-slate-600">
                  PhaRMA T è stato ideato e sviluppato dal Dott. Daniele Leonardi Vinci,
                  Dirigente Farmacista presso A.O.O.R. Villa Sofia - Cervello di Palermo e
                  Coordinatore dell'Area Scientifica Culturale Rischio Clinico SIFO per il
                  mandato 2025-2028.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                  <MessageSquare className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Invio segnalazioni</h2>
                  <p className="mt-3 leading-relaxed text-slate-600">
                    Per segnalare bug, malfunzionamenti, suggerimenti di miglioramento o
                    richieste di modifica, utilizza invia una mail all'indirizzo:
                  </p>
                  <a
                    href={mailtoHref}
                    className="mt-4 inline-flex items-center gap-2 font-semibold text-sky-700 hover:text-sky-800"
                  >
                    <Mail className="h-4 w-4" />
                    {email}
                  </a>
                </div>
              </div>

              <a
                href={mailtoHref}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-700 px-4 py-2.5 font-medium text-white transition hover:bg-sky-800"
              >
                <Mail className="h-4 w-4" />
                Scrivi email
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-slate-900">Formato consigliato</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Oggetto</p>
                <p className="mt-2 break-words font-mono text-sm text-slate-800">
                  [PhaRMA T] {'{tipo segnalazione}'} - {'{titolo}'}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Corpo</p>
                <pre className="mt-2 whitespace-pre-wrap font-mono text-sm text-slate-800">
{`Mittente:


Descrizione:`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

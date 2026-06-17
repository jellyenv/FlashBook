import { ContactsManager } from "@/components/studio/ContactsManager";
import { fetchContacts } from "@/lib/studio-data";

export default async function ContactsPage() {
  const contacts = await fetchContacts();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Contacts</h1>
        <p className="text-muted-foreground">
          Your client address book. New bookings are added here automatically.
        </p>
      </div>
      <ContactsManager contacts={contacts} />
    </div>
  );
}

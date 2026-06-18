import { redirect } from "next/navigation";
import AdminClient from "../../components/AdminClient";
import { isAdmin } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { businessTimeZone } from "../../lib/time";

export const metadata = {
  title: "Admin Dashboard | AJ's Painting"
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) redirect("/admin/login");

  const now = new Date();
  const [leads, appointments, galleryPhotos, availability, blockedDays, siteAssets, statsRaw] = await Promise.all([
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      include: { photos: true, followUpNotes: { orderBy: { createdAt: "asc" } } }
    }),
    prisma.appointment.findMany({ where: { startsAt: { gte: now } }, orderBy: { startsAt: "asc" } }),
    prisma.galleryPhoto.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.availabilitySlot.findMany({ where: { active: true }, orderBy: [{ weekday: "asc" }, { startTime: "asc" }] }),
    prisma.blockedDay.findMany({ where: { date: { gte: now } }, orderBy: { date: "asc" } }),
    prisma.siteAsset.findMany(),
    Promise.all([
      prisma.lead.count({ where: { status: "NEW" } }),
      prisma.appointment.count({ where: { startsAt: { gte: now } } }),
      prisma.lead.count({ where: { status: "COMPLETED" } }),
      prisma.lead.count({ where: { status: "WON" } })
    ])
  ]);

  const stats = {
    newLeads: statsRaw[0],
    upcomingAppointments: statsRaw[1],
    completedJobs: statsRaw[2],
    wonJobs: statsRaw[3]
  };

  return (
    <AdminClient
      initialLeads={JSON.parse(JSON.stringify(leads))}
      appointments={JSON.parse(JSON.stringify(appointments))}
      galleryPhotos={JSON.parse(JSON.stringify(galleryPhotos))}
      availability={JSON.parse(JSON.stringify(availability))}
      blockedDays={JSON.parse(JSON.stringify(blockedDays))}
      siteAssets={JSON.parse(JSON.stringify(siteAssets))}
      stats={stats}
      timeZone={businessTimeZone()}
    />
  );
}

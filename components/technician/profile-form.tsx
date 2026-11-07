"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";

import PendingButton from "@/components/pending-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { TechnicianProfile } from "@/lib/technician-types";
import { technicianProfileSchema, type TechnicianProfileValues } from "@/validations/technician.validation";

export default function ProfileForm({ profile, onSaved }: { profile: TechnicianProfile | null; onSaved: () => void }) {
  const [values, setValues] = useState<TechnicianProfileValues>({
    bio: profile?.bio ?? "",
    skills: profile?.skills.join(", ") ?? "",
    experienceYears: String(profile?.experienceYears ?? 0),
    location: profile?.location ?? "",
    profilePhoto: profile?.profilePhoto ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const result = technicianProfileSchema.safeParse(values);
    if (!result.success) { setErrors(result.error.flatten().fieldErrors); return; }
    setErrors({});
    setPending(true);
    try {
      await axios.put("/api/technician/profile", values);
      toast.success("Profile saved.");
      onSaved();
    } catch (failure) {
      toast.error(axios.isAxiosError(failure) ? failure.response?.data?.message ?? "Could not save profile." : "Could not save profile.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2" noValidate><div className="space-y-1 sm:col-span-2"><Label htmlFor="bio">Bio</Label><Textarea id="bio" value={values.bio ?? ""} onChange={(event) => setValues({ ...values, bio: event.target.value })} /></div><div className="space-y-1"><Label htmlFor="skills">Skills (comma separated)</Label><Input id="skills" value={values.skills} onChange={(event) => setValues({ ...values, skills: event.target.value })} aria-invalid={!!errors.skills} aria-describedby={errors.skills ? "skills-error" : undefined} />{errors.skills && <p id="skills-error" className="text-xs text-destructive">{errors.skills[0]}</p>}</div><div className="space-y-1"><Label htmlFor="experienceYears">Years of experience</Label><Input id="experienceYears" inputMode="numeric" value={values.experienceYears} onChange={(event) => setValues({ ...values, experienceYears: event.target.value })} aria-invalid={!!errors.experienceYears} aria-describedby={errors.experienceYears ? "experience-error" : undefined} />{errors.experienceYears && <p id="experience-error" className="text-xs text-destructive">{errors.experienceYears[0]}</p>}</div><div className="space-y-1"><Label htmlFor="location">Location</Label><Input id="location" value={values.location} onChange={(event) => setValues({ ...values, location: event.target.value })} aria-invalid={!!errors.location} aria-describedby={errors.location ? "profile-location-error" : undefined} />{errors.location && <p id="profile-location-error" className="text-xs text-destructive">{errors.location[0]}</p>}</div><div className="space-y-1"><Label htmlFor="profilePhoto">Profile photo URL (optional)</Label><Input id="profilePhoto" type="url" value={values.profilePhoto ?? ""} onChange={(event) => setValues({ ...values, profilePhoto: event.target.value })} aria-invalid={!!errors.profilePhoto} aria-describedby={errors.profilePhoto ? "photo-error" : undefined} />{errors.profilePhoto && <p id="photo-error" className="text-xs text-destructive">{errors.profilePhoto[0]}</p>}</div><div className="sm:col-span-2"><PendingButton type="submit" pending={pending} pendingText="Saving profile">Save profile</PendingButton></div></form>;
}

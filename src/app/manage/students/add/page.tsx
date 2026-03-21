"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import Navbar from "@/components/Navbar";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Batch {
  id: string;
  name: string;
  _count: { students: number };
}

export default function AddStudentPage() {
  const router = useRouter();

  const { data: batches } = useSWR<Batch[]>("/api/batches", fetcher);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phones, setPhones] = useState<string[]>([""]);
  const [batchId, setBatchId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const addPhoneField = () => setPhones([...phones, ""]);
  const removePhoneField = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index));
  };
  const updatePhone = (index: number, value: string) => {
    const updated = [...phones];
    updated[index] = value;
    setPhones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim() || !email.trim() || !batchId) {
      setError("Name, email, and batch are required.");
      return;
    }

    setLoading(true);
    try {
      const phoneNumbers = phones.filter((p) => p.trim() !== "");
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phoneNumbers, batchId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to add student.");
        return;
      }
      router.push("/manage/students");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-700 mb-6">Add Student</h1>

        <div className="neu-raised p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="neu-input w-full"
                placeholder="Student name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="neu-input w-full"
                placeholder="student@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Phone Numbers</label>
              {phones.map((phone, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => updatePhone(i, e.target.value)}
                    className="neu-input w-full"
                    placeholder="Phone number"
                  />
                  {phones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePhoneField(i)}
                      className="neu-btn-danger px-3 py-1.5 text-xs shrink-0"
                    >
                      X
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addPhoneField}
                className="neu-btn px-3 py-1.5 text-xs text-gray-600"
              >
                Add Phone
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Batch</label>
              <select
                value={batchId}
                onChange={(e) => setBatchId(e.target.value)}
                className="neu-input w-full"
                required
              >
                <option value="">Select batch...</option>
                {batches?.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="neu-btn-gradient px-5 py-2 text-sm font-medium"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Student"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/manage/students")}
                className="neu-btn px-5 py-2 text-sm font-medium text-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

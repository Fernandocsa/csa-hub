import { useQuery } from "@tanstack/react-query";
import { customFetch } from "./custom-fetch";

export type BirthdayPerson = {
  id: number;
  name: string;
  nationality: string | null;
  photoUrl: string | null;
  birthDate: string;
  age: number | null;
  isDeceased: boolean;
  kind: "player" | "manager";
  position?: string | null;
  nationalityFlag?: string | null;
};

export type BirthdaysPayload = {
  date: string;
  players: BirthdayPerson[];
  managers: BirthdayPerson[];
};

export const getBirthdaysToday = () =>
  customFetch<BirthdaysPayload>("/api/birthdays/today");

export const getBirthdaysTodayQueryKey = () =>
  ["/api/birthdays/today"] as const;

export const useGetBirthdaysToday = () =>
  useQuery({
    queryKey: getBirthdaysTodayQueryKey(),
    queryFn: getBirthdaysToday,
    staleTime: 60_000,
  });

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDynamicGreeting(name: string): string {
  const hour = new Date().getHours();
  let timeOfDay = "Morning";
  
  if (hour >= 12 && hour < 17) {
    timeOfDay = "Afternoon";
  } else if (hour >= 17 || hour < 4) {
    timeOfDay = "Evening";
  }

  const greetings = {
    Morning: [
      `Good morning, ${name}! 👋`,
      `Rise and shine, ${name}! ☀️`,
      `Ready for a great day, ${name}? 🚀`,
      `Hope you're having a good morning, ${name}! ☕`
    ],
    Afternoon: [
      `Good afternoon, ${name}! 🌤️`,
      `Hope your day is going well, ${name}! ✨`,
      `Keep up the great work, ${name}! 💪`,
      `Having a productive afternoon, ${name}? ⏳`
    ],
    Evening: [
      `Good evening, ${name}! 🌙`,
      `Winding down, ${name}? 🌃`,
      `Great work today, ${name}! 🏆`,
      `Hope you had a good day, ${name}! 🛋️`
    ]
  };

  const options = greetings[timeOfDay as keyof typeof greetings];
  const randomIndex = Math.floor(Math.random() * options.length);
  return options[randomIndex];
}

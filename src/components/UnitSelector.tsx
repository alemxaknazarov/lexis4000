import React from 'react';
import { CheckCircle2, ChevronRight, PlayCircle, Sparkles } from 'lucide-react';
import type { UnitProgress } from '../lib/supabase';
import { BookCover } from './BookCover';

interface UnitSelectorProps {
  bookNumber: number;
  onSelectUnit: (unitNumber: number) => void;
  unitProgressList: UnitProgress[];
}

export const UnitSelector: React.FC<UnitSelectorProps> = ({
  bookNumber,
  onSelectUnit,
  unitProgressList
}) => {
  const BOOK_1_UNIT_TITLES = [
    "The Lion and the Rabbit",
    "The Laboratory",
    "The Report",
    "The Dog’s Bell",
    "The Jackal and the Sun Child",
    "The Friendly Ghost",
    "The Best Prince",
    "How the Sun and the Moon Were Made",
    "The Starfish",
    "The First Peacock",
    "Princess Rose and the Creature",
    "The Crazy Artist",
    "The Farmer and the Cats",
    "A Magical Book",
    "The Big Race",
    "Adams County’s Gold",
    "The Race for Water",
    "The Little Red Chicken",
    "Shipwrecked",
    "The Seven Cities of Gold",
    "Katy",
    "A Better Reward",
    "The Camp",
    "A Strong Friendship",
    "Joe’s Pond",
    "Archie and His Donkey",
    "The Spider and the Bird",
    "The Party",
    "How the World Got Light",
    "Cats and Secrets"
  ];

  const BOOK_2_UNIT_TITLES = [
    "The Twelve Months",
    "The Dragon",
    "The Battle of Thermopylae",
    "The Deer and His Image",
    "May 29, 1953",
    "The Frog Prince",
    "A Beautiful Bird",
    "Tricky Turtle",
    "The Tale of Bartelby O'Boyle",
    "Blackbeard",
    "Dinosaur Drawings",
    "The Mean Chef",
    "The Cat and the Fox",
    "The Good Student",
    "The Lucky Knife",
    "Prince Sam",
    "Henry Ford's Famous Car",
    "The Priest",
    "Mrs. May and the Green Girl",
    "Albert Einstein",
    "From the Earth to the Stars",
    "The Farm Festival",
    "The Clever Thief",
    "The Doctor's Cure",
    "The Criminal",
    "The Two Captains",
    "The Duke and the Minister",
    "The Fisherman",
    "Osiris and the Nile",
    "The Taxi Driver"
  ];

  const BOOK_3_UNIT_TITLES = [
    "The Real St. Nick",
    "The Shepherd and the Wild Sheep",
    "The Boy and his Sled",
    "Tiny Tina",
    "Trick-or-treat!",
    "The Senator and the Worm",
    "Patsy Ann",
    "The Anniversary Gift",
    "Dalton vs. the Bully",
    "Anna the Babysitter",
    "Peter and the Dwarf",
    "The Ice Cream Cone Explosion",
    "Sheriff Dan",
    "The Helpful Apprentice",
    "Why Monkey Has No Home",
    "Matthew Learns a Lesson",
    "The Magic Cup",
    "The Knight's Plan",
    "The Magic Pear Tree",
    "Little Wolf and Mother Wolf",
    "The Old Man with a Bump",
    "The Circus",
    "Lazy Hans",
    "The Bremen Town Musicians",
    "How Did Greenland Get Its Name?",
    "Everyone is Special",
    "Pizarro and the Inca Gold",
    "The Boy Who Saved the Town",
    "An Interesting Life",
    "The Kitten and the Caterpillar"
  ];

  const BOOK_4_UNIT_TITLES = [
    "The History of Chocolate",
    "Monkey Island",
    "The Young Man and the Old Man",
    "The Tricky Fox",
    "The Magic Computer",
    "Jack Frost and the Pudding",
    "The Architect's Plan",
    "Janie and the Music Player",
    "Growing to be Great",
    "Anton's Great Discovery",
    "How a Singer Helped Win the War",
    "The Sun and the North Wind",
    "The Big Race",
    "The Brothers and the Bread",
    "Laika, the Space Dog",
    "Gwen's New Friends",
    "Kara Goes Camping",
    "The School Play",
    "Isaac's First Plane Trip",
    "The Betrayal",
    "The Teller and the Thieves",
    "The Scribe's Warning",
    "How the Dinosaurs Really Died",
    "The Traveler and the Innkeeper",
    "Gilbert and the Lizard",
    "The Forest People",
    "A Dying Forest",
    "Thucydides and the Plague of Athens",
    "The Solar Car Race",
    "The Heirs"
  ];

  const BOOK_5_UNIT_TITLES = [
    "The Little Mice",
    "The Helpful Abbey",
    "The Bachelor's Lesson",
    "The Corrupt Administrator",
    "A Famous Accident",
    "The Island",
    "Small World",
    "Becoming a Healer",
    "The Weaving Machine",
    "Life on the Farm",
    "Beethoven's Gift",
    "Brothers",
    "The Old Hound",
    "Day Without Sight",
    "The Big Ship",
    "The History of Parachutes",
    "I Didn't Do It!",
    "The Soldier's Decision",
    "Jane's Pride",
    "Microchips",
    "The Twins",
    "The New Bioco",
    "How Comet Got His Tail",
    "The Resourceful Landlord",
    "The Man and the Monkey",
    "Cosmo's Flight",
    "The First Organ Transplant",
    "The Lottery",
    "Jen's New Job",
    "The Demon's Bridge"
  ];

  const BOOK_6_UNIT_TITLES = [
    "The North Star",
    "The Fossil Hunters",
    "Dressed to Excess",
    "The Butler's Bad Day",
    "A Bet",
    "Amazing Komodo Dragons",
    "Greek Magical Papyri",
    "Class Distinctions",
    "Dangerous Bites",
    "The Avalanche",
    "The Lydian King",
    "The Butler",
    "The End of Smallpox",
    "The Coward's Lesson",
    "Epidemic in Zimbabwe",
    "The Brute and the Billionaire",
    "The Tenacious Inventor",
    "The Nurse's Lesson",
    "Seizures Then and Now",
    "The Greedy Bee",
    "The Mayor of Sherman",
    "The Editor's Choice",
    "The Ice House",
    "Preparing for the Future",
    "Hundred Plays",
    "The Kidnapping",
    "The Earl of Shining",
    "The Lord and the Farmers",
    "The Shortcut",
    "The Mad Hatter"
  ];

  const unitTitles =
    bookNumber === 6
      ? BOOK_6_UNIT_TITLES
      : bookNumber === 5
      ? BOOK_5_UNIT_TITLES
      : bookNumber === 4
      ? BOOK_4_UNIT_TITLES
      : bookNumber === 3
      ? BOOK_3_UNIT_TITLES
      : bookNumber === 2
      ? BOOK_2_UNIT_TITLES
      : BOOK_1_UNIT_TITLES;

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-14 sm:w-16 shrink-0">
            <BookCover bookNumber={bookNumber} />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2.5 py-0.5 rounded-full mb-1">
              <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              <span>Book {bookNumber}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Unitlar ro‘yxati (1 – 30)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              4000 Essential English Words • Paul Nation
            </p>
          </div>
        </div>
      </div>

      {/* Grid of 30 units */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 30 }).map((_, index) => {
          const unitNumber = index + 1;
          const title = unitTitles[index] || `Vocabulary Set ${unitNumber}`;
          const progress = unitProgressList.find((p) => p.unit_number === unitNumber && p.book_number === bookNumber);
          const accuracy = progress?.accuracy_percentage || 0;
          const isCompleted = progress?.is_completed || accuracy >= 100;
          const learnedWordsCount = progress?.learned_words_count ?? Math.round((accuracy / 100) * 20);

          return (
            <div
              key={unitNumber}
              onClick={() => onSelectUnit(unitNumber)}
              className={`group p-3.5 rounded-xl border transition-all duration-150 cursor-pointer flex flex-col justify-between ${
                isCompleted
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-500'
                  : accuracy > 0
                  ? 'bg-white dark:bg-slate-900 border-amber-300/70 dark:border-amber-800/60 hover:border-amber-500'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/60'
              }`}
            >
              <div className="flex items-start justify-between mb-2.5">
                <span className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  {unitNumber}
                </span>

                {isCompleted ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full font-mono">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>100%</span>
                  </span>
                ) : accuracy > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 px-2 py-0.5 rounded-full font-mono">
                    <span>{accuracy}%</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">
                    20 so‘z
                  </span>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white text-xs sm:text-sm group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-0.5">
                  Unit {unitNumber}: {title}
                </h4>
                <p className="text-[11px] text-slate-400">
                  {isCompleted
                    ? 'Tugallangan (20/20)'
                    : accuracy > 0
                    ? `${learnedWordsCount} / 20 so‘z o‘rganildi`
                    : 'Boshlanmagan'}
                </p>

                {accuracy > 0 && !isCompleted && (
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-amber-500 dark:bg-amber-400 rounded-full transition-all duration-300"
                      style={{ width: `${accuracy}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                <span className="flex items-center gap-1 text-[11px] font-medium">
                  <PlayCircle className="w-3 h-3" />
                  <span>Boshlash</span>
                </span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

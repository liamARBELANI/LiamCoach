import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import type { IntakeValues } from '@/schemas/intake';
import type { NutritionValues } from '@/schemas/nutrition';
import type { IntakeForm, NutritionForm } from '@/types';
import { useCreateClient } from '@/hooks/clients';
import { useIntakeDraft } from '@/hooks/useIntakeDraft';
import { ProgressDots } from './ProgressDots';
import { Step1Intake, STEP1_CARDS } from './Step1Intake';
import { Step2Nutrition, STEP2_CARDS } from './Step2Nutrition';

const cardVariants = {
  enter: (dir: number) => ({ y: dir > 0 ? 48 : -48, opacity: 0 }),
  center: { y: 0, opacity: 1 },
  exit: (dir: number) => ({ y: dir > 0 ? -32 : 32, opacity: 0 }),
};
const cardTransition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] as const };

export function IntakeWizard() {
  const navigate = useNavigate();
  const { getStep1, getStep2, saveStep1, saveStep2, clearDraft } = useIntakeDraft();
  const createClient = useCreateClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [cardIdx, setCardIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [step1Data, setStep1Data] = useState<IntakeValues | null>(null);
  const [goalImageFile, setGoalImageFile] = useState<File | null>(null);

  const totalCards = step === 1 ? STEP1_CARDS.length : STEP2_CARDS.length;

  const handleStep1Change = useCallback(
    (values: Partial<IntakeValues>) => saveStep1(values),
    [saveStep1],
  );
  const handleStep2Change = useCallback(
    (values: Partial<NutritionValues>) => saveStep2(values),
    [saveStep2],
  );

  function advance(newCardIdx: number, newStep?: 1 | 2) {
    const movingForward = newStep ? newStep > step : newCardIdx > cardIdx;
    setDirection(movingForward ? 1 : -1);
    if (newStep) setStep(newStep);
    setCardIdx(newCardIdx);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }

  function handleNextCard() {
    advance(cardIdx + 1);
  }

  function handleBack() {
    if (cardIdx > 0) {
      advance(cardIdx - 1);
    } else if (step === 2) {
      advance(STEP1_CARDS.length - 1, 1);
    }
  }

  function handleStep1Finish(data: IntakeValues, imageFile: File | null) {
    setStep1Data(data);
    setGoalImageFile(imageFile);
    advance(0, 2);
  }

  async function handleFinalSubmit(nutritionData: NutritionValues) {
    if (!step1Data) return;
    try {
      await createClient.mutateAsync({
        intake: step1Data as unknown as IntakeForm,
        nutrition: nutritionData as unknown as NutritionForm,
        goalImageFile,
      });
      clearDraft();
      navigate('/intake/success');
    } catch {
      toast.error('אירעה שגיאה בשליחת הטופס. נסה שוב.');
    }
  }

  const showBack = cardIdx > 0 || step === 2;

  return (
    <div className="intake-bg min-h-dvh">
      {/* Sticky progress nav */}
      <div className="sticky top-0 z-10">
        <ProgressDots
          step={step}
          cardIdx={cardIdx}
          totalCards={totalCards}
          onBack={showBack ? handleBack : undefined}
        />
      </div>

      {/* Animated card area */}
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={`${step}-${cardIdx}`}
          custom={direction}
          variants={cardVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={cardTransition}
        >
          {step === 1 ? (
            <Step1Intake
              defaultValues={getStep1()}
              onChange={handleStep1Change}
              cardIdx={cardIdx}
              onNextCard={handleNextCard}
              onFinish={handleStep1Finish}
            />
          ) : (
            <Step2Nutrition
              defaultValues={getStep2()}
              onChange={handleStep2Change}
              cardIdx={cardIdx}
              onNextCard={handleNextCard}
              onSubmit={handleFinalSubmit}
              isSubmitting={createClient.isPending}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

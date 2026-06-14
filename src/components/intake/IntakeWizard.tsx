import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { toast } from 'sonner';
import type { IntakeValues } from '@/schemas/intake';
import type { NutritionValues } from '@/schemas/nutrition';
import type { IntakeForm, NutritionForm } from '@/types';
import { useCreateClient } from '@/hooks/clients';
import { useIntakeDraft } from '@/hooks/useIntakeDraft';
import { ProgressBar } from './ProgressBar';
import { Step1Intake } from './Step1Intake';
import { Step2Nutrition } from './Step2Nutrition';

const variants = {
  enter: (dir: number) => ({ x: dir > 0 ? '40%' : '-40%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? '-40%' : '40%', opacity: 0 }),
};

const transition = { duration: 0.28, ease: [0.4, 0, 0.2, 1] as const };

export function IntakeWizard() {
  const navigate = useNavigate();
  const { getStep1, getStep2, saveStep1, saveStep2, clearDraft } = useIntakeDraft();
  const createClient = useCreateClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState(1);
  const [step1Data, setStep1Data] = useState<IntakeValues | null>(null);
  const [goalImageFile, setGoalImageFile] = useState<File | null>(null);

  const handleStep1Change = useCallback(
    (values: Partial<IntakeValues>) => {
      saveStep1(values);
    },
    [saveStep1],
  );

  const handleStep2Change = useCallback(
    (values: Partial<NutritionValues>) => {
      saveStep2(values);
    },
    [saveStep2],
  );

  function goToStep2(data: IntakeValues, imageFile: File | null) {
    setStep1Data(data);
    setGoalImageFile(imageFile);
    setDirection(1);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    setDirection(-1);
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="relative overflow-hidden">
      <ProgressBar step={step} total={2} />

      <AnimatePresence mode="wait" custom={direction} initial={false}>
        {step === 1 ? (
          <motion.div
            key="step1"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <Step1Intake
              defaultValues={getStep1()}
              onChange={handleStep1Change}
              onNext={goToStep2}
            />
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={transition}
          >
            <Step2Nutrition
              defaultValues={getStep2()}
              onChange={handleStep2Change}
              onSubmit={handleFinalSubmit}
              onBack={goBack}
              isSubmitting={createClient.isPending}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

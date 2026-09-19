export type PayslipUploadRequest = {
  fileData: string;
  mimeType: string;
  month: number;
  year: number;
  confirmReplace?: boolean;
};

type FreeReplacementConflict = {
  response?: {
    status?: number;
    data?: { error?: string };
  };
};

function requiresFreeReplacementConfirmation(error: unknown) {
  const conflict = error as FreeReplacementConflict;
  return conflict.response?.status === 409
    && conflict.response.data?.error === 'FREE_REPLACE_CONFIRMATION_REQUIRED';
}

export async function uploadPayslipWithFreeReplacementConfirmation<Response>({
  request,
  upload,
  confirmReplacement,
}: {
  request: PayslipUploadRequest;
  upload: (request: PayslipUploadRequest) => Promise<Response>;
  confirmReplacement: () => boolean;
}): Promise<{ status: 'uploaded'; response: Response } | { status: 'replacement_cancelled' }> {
  try {
    return { status: 'uploaded', response: await upload(request) };
  } catch (error) {
    if (!requiresFreeReplacementConfirmation(error)) throw error;
    if (!confirmReplacement()) return { status: 'replacement_cancelled' };
    return { status: 'uploaded', response: await upload({ ...request, confirmReplace: true }) };
  }
}

import Campaign from "../models/Campaign.js";
import Application from "../models/Application.js";
import Submission from "../models/Submission.js";
import AppError from "../utils/AppError.js";
import withSubmissionCredits from "../utils/withSubmissionCredits.js";
import {
  createSubmission,
  getCampaignSubmissions,
  reviewSubmission,
  resubmitContent,
} from "../services/submission.service.js";

const submitContent = async (req, res) => {
  const { contentUrl, caption } = req.body;

  if (!contentUrl) {
    throw new AppError("Content URL is required", 400);
  }

  const submission = await createSubmission({
    campaignId: req.params.campaignId,
    creatorId: req.user.userId,
    contentUrl,
    caption,
  });

  res.status(201).json({
    success: true,
    message: "Content submitted successfully",
    data: {
      submission,
    },
  });
};

const getSubmissions = async (req, res) => {
  const submissions = await getCampaignSubmissions({
    campaignId: req.params.campaignId,
    brandId: req.user.userId,
  });

  res.status(200).json({
    success: true,
    results: submissions.length,
    data: {
      submissions,
    },
  });
};

const review = async (req, res) => {
  const { decision, feedback } = req.body;

  const submission = await reviewSubmission({
    submissionId: req.params.submissionId,
    brandId: req.user.userId,
    decision,
    feedback,
  });

  res.status(200).json({
    success: true,
    message: "Submission reviewed successfully",
    data: {
      submission,
    },
  });
};

const resubmit = async (req, res) => {
  const { contentUrl, caption } = req.body;

  if (!contentUrl) {
    throw new AppError("Content URL is required", 400);
  }

  const submission = await resubmitContent({
    submissionId: req.params.submissionId,
    creatorId: req.user.userId,
    contentUrl,
    caption,
  });

  res.status(200).json({
    success: true,
    message: "Content resubmitted successfully",
    data: {
      submission,
    },
  });
};

const getMySubmissions = async (req, res, next) => {
  try {
    const creatorId = req.user.userId;

    /*
    |--------------------------------------------------------------------------
    | Accepted applications
    |--------------------------------------------------------------------------
    |
    | These represent campaigns the creator is allowed to submit content for.
    |
    */

    const acceptedApplications = await Application.find({
      creatorId,
      status: "ACCEPTED",
    })
      .populate({
        path: "campaignId",
        select:
          "title description platform contentType rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status brandId",
        populate: {
          path: "brandId",
          select: "name",
        },
      })
      .sort({
        updatedAt: -1,
      })
      .lean();

    /*
    |--------------------------------------------------------------------------
    | Creator submissions
    |--------------------------------------------------------------------------
    */

    const submissions = await Submission.find({
      creatorId,
    })
      .populate({
        path: "campaignId",
        select:
          "title platform contentType rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status brandId",
        populate: {
          path: "brandId",
          select: "name",
        },
      })
      .populate({
        path: "applicationId",
        select: "status",
      })
      .sort({
        updatedAt: -1,
      })
      .lean();

    /*
    |--------------------------------------------------------------------------
    | Campaigns already submitted
    |--------------------------------------------------------------------------
    */

    const submittedCampaignIds = new Set(
      submissions
        .filter((submission) => submission.campaignId)
        .map((submission) =>
          submission.campaignId._id.toString()
        )
    );

    /*
    |--------------------------------------------------------------------------
    | Ready to Submit
    |--------------------------------------------------------------------------
    |
    | Accepted applications that do not yet have a submission.
    |
    */

    const readyToSubmit = acceptedApplications
      .filter((application) => {
        if (!application.campaignId) {
          return false;
        }

        return !submittedCampaignIds.has(
          application.campaignId._id.toString()
        );
      })
      .map((application) => ({
        applicationId: application._id,

        campaignId: application.campaignId._id,

        campaignTitle:
          application.campaignId.title,

        brand:
          application.campaignId.brandId
            ? {
                _id:
                  application.campaignId.brandId._id,

                name:
                  application.campaignId.brandId.name,
              }
            : null,

        platform:
          application.campaignId.platform,

        contentType:
          application.campaignId.contentType,

        rewardRatePerThousandViews: application.campaignId.rewardRatePerThousandViews,

        deadline:
          application.campaignId.deadline,

        campaignStatus:
          application.campaignId.status,

        status: "READY_TO_SUBMIT",
      }));

    /*
    |--------------------------------------------------------------------------
    | Categorise existing submissions
    |--------------------------------------------------------------------------
    */

    const underReview = submissions.filter(
      (submission) =>
        submission.status === "SUBMITTED"
    );

    const needsRevision = submissions.filter(
      (submission) =>
        submission.status ===
        "REVISION_REQUESTED"
    );

    const approved = submissions.filter(
      (submission) =>
        submission.status === "APPROVED"
    );

    const rejected = submissions.filter(
      (submission) =>
        submission.status === "REJECTED"
    );

    /*
    |--------------------------------------------------------------------------
    | Response
    |--------------------------------------------------------------------------
    */

    return res.status(200).json({
      success: true,

      data: {
        summary: {
          readyToSubmit:
            readyToSubmit.length,

          underReview:
            underReview.length,

          needsRevision:
            needsRevision.length,

          approved:
            approved.length,
        },

        readyToSubmit,

        underReview,

        needsRevision,

        approved,

        rejected,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getSubmissionById = async (req, res, next) => {
  try {
    const { submissionId } = req.params;

    if (!/^[a-f\d]{24}$/i.test(submissionId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid submission ID.",
      });
    }

    const submission = await Submission.findById(submissionId)
      .populate({
        path: "campaignId",
        select:
          "title description requirements platform contentType rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status brandId",
        populate: { path: "brandId", select: "name email" },
      })
      .populate({
        path: "applicationId",
        select: "status message createdAt reviewedAt",
      });

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: "Submission not found.",
      });
    }

    const { role, userId } = req.user;
    const allowed =
      role === "ADMIN" ||
      (role === "CREATOR" && submission.creatorId?.toString() === userId) ||
      (role === "BRAND" &&
        submission.campaignId?.brandId?._id?.toString() === userId);

    if (!allowed) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to access this submission.",
      });
    }

    const [accountedSubmission] = await withSubmissionCredits([submission]);
    return res.status(200).json({ success: true, data: { submission: accountedSubmission } });
  } catch (error) {
    next(error);
  }
};

export { submitContent, getSubmissions, review, resubmit, getMySubmissions, getSubmissionById };

const getBrandSubmissions = async (
  req,
  res,
  next
) => {
  try {
    const brandId =
      req.user.userId;

    const campaigns =
      await Campaign.find({
        brandId,
      })
        .select(
          "_id title platform rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status"
        )
        .lean();

    const campaignIds =
      campaigns.map(
        (campaign) =>
          campaign._id
      );

    const submissions =
      await Submission.find({
        campaignId: {
          $in: campaignIds,
        },
      })
        .populate({
          path: "creatorId",
          select:
            "name email",
        })
        .populate({
          path: "campaignId",
          select:
            "title platform rewardRatePerThousandViews minimumPayout maximumPayoutPerCreator campaignBudget creatorSlots deadline status",
        })
        .populate({
          path: "applicationId",
          select:
            "status",
        })
        .sort({
          updatedAt: -1,
        })
        .lean();

    const summary = {
      total:
        submissions.length,

      awaitingReview:
        submissions.filter(
          (item) =>
            item.status ===
            "SUBMITTED"
        ).length,

      revisionRequested:
        submissions.filter(
          (item) =>
            item.status ===
            "REVISION_REQUESTED"
        ).length,

      approved:
        submissions.filter(
          (item) =>
            item.status ===
            "APPROVED"
        ).length,

      rejected:
        submissions.filter(
          (item) =>
            item.status ===
            "REJECTED"
        ).length,
    };

    return res.status(200).json({
      success: true,

      data: {
        summary,
        submissions,
      },
    });
  } catch (error) {
    next(error);
  }
};

export { getBrandSubmissions };

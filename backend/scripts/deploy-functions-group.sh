#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

GROUP="${1:-}"
if [ -z "$GROUP" ]; then
  echo "Usage: bash scripts/deploy-functions-group.sh <group>"
  echo "Groups: huddle, chat, circles, admin, content, assessment, user, triggers, infra"
  exit 1
fi

case "$GROUP" in
  huddle)
    FUNCTIONS_FILTER="startHuddle,joinHuddle,endHuddle,ringHuddleParticipants,ringPendingHuddles,updateHuddleState,scheduleHuddle,deleteScheduledHuddle,toggleScheduledHuddleReminder,processScheduledHuddles"
    ;;
  chat)
    FUNCTIONS_FILTER="onMessageCreate,createDirectChat,sendMessage"
    ;;
  circles)
    FUNCTIONS_FILTER="createCircle,joinCircle,updateCircle,leaveCircle,manageMember,handleJoinRequest,resolveCircleReport,submitReport"
    ;;
  admin)
    FUNCTIONS_FILTER="getDashboardStats,getAllUsers,getPendingContent,getAllContent,updateContentStatus,toggleUserStatus,deleteItem,getAdminAffirmations,createAffirmation,deleteAffirmation,getTransactions,getReports,resolveReport,getSupportTickets,updateTicketStatus,backfillUserCircles"
    ;;
  content)
    FUNCTIONS_FILTER="getExploreContent,getRecommendedContent,getAffirmations,submitContactForm,sendAffirmationsMorning,sendAffirmationsAfternoon,sendAffirmationsEvening"
    ;;
  assessment)
    FUNCTIONS_FILTER="submitAssessment,getUserStats,getKeyChallenges,seedChallenges,seedResources,seedAssessmentQuestions,fixAssessmentQuestionsText,seedAffirmations,backfillAffirmationImages,seedAll,getSeedStatus"
    ;;
  user)
    FUNCTIONS_FILTER="onUserCreate,createEmployee,deleteUserAccount,updateSubscription"
    ;;
  triggers)
    FUNCTIONS_FILTER="onUserCreate,onMessageCreate"
    ;;
  infra)
    FUNCTIONS_FILTER="generateUploadSignature"
    ;;
  *)
    echo "Unknown group '$GROUP'"
    echo "Groups: huddle, chat, circles, admin, content, assessment, user, triggers, infra"
    exit 1
    ;;
esac

export FUNCTIONS_FILTER
bash scripts/deploy-functions-batched.sh

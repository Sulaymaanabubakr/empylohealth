# Circles Health App
# Scoring and Metrics Guide

This guide explains how the key numbers in Circles are calculated.

1. WELLBEING SCORE

The wellbeing score shown on the dashboard is on a 0 to 100 scale.

How it is calculated:
- The app takes a weekly baseline from the weekly questionnaire.
- The app then adds a small daily trend adjustment from recent daily check-ins.
- Daily check-ins can move the score, but only within a controlled range.

Current formula:
- dailyAvg7 = average of the latest daily check-ins, up to 7 entries
- weeklyAnchor = latest weekly questionnaire score
- dailyDelta = dailyAvg7 minus weeklyAnchor
- dailyAdjustment = 25 percent of dailyDelta, rounded, and capped between -10 and +10
- finalWellbeingScore = weeklyAnchor plus dailyAdjustment, capped between 0 and 100

Example:
- Weekly anchor is 80
- Daily average is 60
- Daily delta is -20
- Daily adjustment is -5
- Final wellbeing score is 75

If no weekly anchor exists yet, the app falls back to daily scoring until a weekly questionnaire is completed.

2. WELLBEING LABELS

Score bands:
- 80 to 100: Thriving
- 60 to 79: Doing Well
- 40 to 59: Okay
- 20 to 39: Struggling
- 0 to 19: Needs Attention

3. WEEKLY QUESTIONNAIRE SCORING

Each weekly answer maps to points:
- Not at all = 0
- Rarely = 1
- Sometimes = 2
- Most times = 3
- Always = 4

Weekly score formula:
- weeklyScore = round(totalPoints divided by maxPoints times 100)

4. DAILY CHECK-IN SCORING

Daily check-in converts user input to a 0 to 100 score.

Main flow used in the app:
- dailyScore = round(focusLevel divided by 10 times 100)

There is also another slider flow in the app that maps from a 5-step scale to 0 to 100.

5. WHEN WEEKLY OR DAILY IS REQUESTED

The app decides which assessment to show as follows:
- Weekly is checked by ISO week key.
- Weekly reset timezone is Africa Lagos.
- If weekly is due, weekly flow is shown first.
- If weekly is not due, daily check-in is shown if none was submitted that day.

6. STREAKS

Personal streak:
- The app currently reads personal streak from user profile fields.
- Display source is users.streak, with fallback to users.stats.streak.

Important note:
- In the current implementation, submitting an assessment does not automatically increment streak in the same scoring flow.

Circle streak:
- Circle streak is calculated from circle chat activity.
- The app counts consecutive active days from recent messages.

7. CIRCLE MEMBER POINTS AND LEVELS

In Circle Analysis leaderboard:
- contributionPoints = 100 plus messageCount times 15
- level = floor(contributionPoints divided by 60)

Important note:
- There is no 200-point cap in the current formula.

8. CIRCLE RATING ON CARDS

If no backend rating is provided, the app uses this fallback:
- Base score starts at 4.2
- Member count bonus:
- More than 50 members: +0.4
- More than 20 members: +0.3
- More than 10 members: +0.2
- More than 2 members: +0.1
- Recency bonus based on last activity:
- Less than 24 hours: +0.4
- Less than 72 hours: +0.2
- Less than 168 hours: +0.1
- Final score is capped at 5.0

9. RED OR GREEN AVATAR RING

Ring color rule:
- Score 70 and above = Green
- Score below 70 = Red

If score is missing, the app can fall back to label text to decide color.

10. KEY CHALLENGES LOGIC

The app checks theme scores and detects weak themes.

Weak themes for challenge targeting:
- Theme score 2 or below

Then:
- It fetches challenges matching those weak themes.
- If none are available, it falls back to top active challenges.
- If still empty, it falls back to resources.

11. RECOMMENDED CONTENT LOGIC

For recommended resources:
- The app uses weak themes at score 3 or below.
- It fetches active resources with matching tags.
- If none match, it falls back to general active resources.

12. MAIN DATA SOURCES

Collections and fields used for metrics:
- assessments collection for raw submissions
- users document fields such as:
- wellbeingScore
- wellbeingLabel
- weeklyScore
- dailyTrendScore
- wellbeingComponents
- stats.themes
- stats.overallScore
- streak

13. PRODUCT INTERPRETATION

How to read these numbers correctly:
- Wellbeing score is a trend indicator, not a diagnosis.
- Weekly questionnaire is the stability anchor.
- Daily check-ins provide controlled short-term movement.
- Circle points are engagement points, not mental health severity.


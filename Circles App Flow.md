# Business Requirements Document 

	![A blue and black logoDescription automatically generated][image1]

# **Project Name: Circles Health App**

**Date:** 24/11/2024

**Version:** 3.1

**Prepared By:** Gracious Musariri

**Reviewed By:** Gracious Musariri**1\. Executive Summary**

The Circles Health App is designed to help users monitor and improve their wellbeing across psychological, physical, and social dimensions. The app provides structured data collection, daily check-ins, and wellbeing scoring in its initial release, with future versions introducing advanced AI-driven functionalities, organizational tools, and community engagement.

# **2\. Business Objectives**

## **Version 1 Objectives:**

\- Deliver a foundational app with structured data collection and wellbeing score calculation.  
\- Establish user engagement and provide actionable insights for individuals.

## **Version 2 Objectives:**

\- Introduce AI-driven features for personalized mental health coaching and organizational tools for wellbeing analytics.  
\- Support admin-level functionality for organizational users.

## **Version 3 Objectives:**

\- Enhance community engagement with forums, gamification, and wearable integrations.  
\- Provide predictive analytics for individual and organizational wellbeing trends.

# **3\. Stakeholders**

## **Primary Stakeholders:**

\- Product Management   
\- Development Team  
\- Marketing and Sales   
\- Users and Organisations

## **Key Users:**

\- Individuals seeking to improve their wellbeing.  
\- Organizations aiming to monitor and enhance team wellness.

# **4\. Functional Requirements**

## **Version 1 (Initial Release):**

1. **Authentication Flow:**  
   \- Secure user login with email, password, and multi-factor authentication (MFA) using a one-time code (OTC).  
2. **Daily Check-Ins:**  
   \- Two questions on emotional and social states, contributing 20% to the weekly wellbeing score.

**3\. Structured Questionnaire:**  
\- Weekly questionnaire assessing psychological, physical, and social dimensions, contributing 80% to the weekly wellbeing score.

**4\. Explore Page:**  
\- Daily affirmations and bite-sized health and wellbeing content.

**5\. Wellbeing Score Calculation:**  
\- Aggregates structured questionnaire (80%) and daily check-in (20%) data.

## **Version 2 (Second Release):**

1. **AI Mental Health Coach:**  
   \- Conversational interface for personalized support and insights.  
2. **AI-Driven Insights:**  
   \- Incorporate AI-analyzed conversation data into wellbeing scoring (30% weighting).

**3\. Admin Interaction with AI (Web App):**  
\- Admins can query the AI for trends and recommendations.

**4\. Graph Database:**  
\- Models relationships and provides advanced analytics for organizational users.

## **Version 3 (Enhanced Engagement):**

**1\. Community Features:**  
\- User-created topics, forums, and gamification elements.

**2\. Wearable Integration:**  
\- Sync data from devices like Fitbit and Apple Watch.

**3\. Predictive Analytics:**  
\- AI-driven predictions for individual risk levels and team trends.

## 

# **5\. Roadmap**

| Version | Key features | Target Timelines | Audience |
| :---- | :---- | :---- | :---- |
| Version 1 |  Structured data, daily check-ins, Explore page  | **Start: Month 1End: Month 4**  | General users  |
| Version 2 | AI-driven features, admin tools, graph database  | **Start: Month 5****End: Month 10**  | Users & organizations  |
| Version 3 | Community features, wearable integration, predictive analytics  | **Start: Month 11****End: Month 18**  | Users & large-scale organisations  |

### 

## **Expanded Timeline: Version 2**

**Duration:** 6 months  
**Start Date:** Month 5  
**End Date:** Month 10

**Milestones:**  
**1\. Month 5-6: Development of AI Features**  
\- Build and integrate the AI Mental Health Coach.  
\- Train Natural Language Processing (NLP) models for conversation insights.  
\- Conduct early testing of AI conversation features.

**2\. Month 7: Development of Admin Tools**  
\- Implement admin dashboard on the web app.  
\- Enable admin interactions with AI for organizational analytics.

**3\. Month 8: Graph Database Implementation**  
\- Develop and test graph database for relationship modeling.  
\- Optimize graph queries for performance and scalability.

**4\. Month 9: Beta Testing**  
\- Internal and external beta testing for AI-driven features and admin tools.  
\- Collect feedback from individual users and organizational admins.

**5\. Month 10: Final Refinements and Public Launch**  
\- Address beta feedback and finalize features.  
\- Conduct security and compliance audits for GDPR and HIPAA.

## **Expanded Timeline: Version 3**

**Duration:** 8 months  
**Start Date:** Month 11  
**End Date:** Month 18

**Milestones:**  
**1\. Month 11-12: Development of Community Features**  
\- Enable user-created topics and forums within Circles.  
\- Introduce gamification elements (e.g., streaks, badges).

**2\. Month 13-14: Wearable Integration**  
\- Integrate APIs for devices like Fitbit and Apple Watch.  
\- Validate data collection for steps, sleep, and activity metrics.

**3\. Month 15-16: Predictive Analytics**  
\- Develop AI-driven predictive analytics for individual risk and organizational trends.  
\- Train models using historical wellbeing data.

**4\. Month 17: Large-Scale Testing**  
\- Conduct scalability testing with larger user groups.  
\- Perform stress tests on the app and backend infrastructure.

**5\. Month 18: Final Refinements and Public Launch**  
\- Address feedback from testing.  
\- Finalize wearable data integration and predictive models.  
\- Conduct final security audits and compliance checks.

# 

# **6\. Wellbeing Score Calculation**

#### ***Version 1 Formula:***

Wellbeing Score (Version 1)=(0.8×Questionnaire Score)+(0.2×Daily Check-In Average)

#### ***Version 2 Formula:***

Wellbeing Score (Version 2) \= (0.5×Questionnaire Score)+(0.3×AI Conversation Score)+(0.2×Daily Check-In Average)

 

# **7\. Process and Data Flow Diagrams**

# **![A screenshot of a computer screenDescription automatically generated][image2]**

# **![A diagram of circles and linesDescription automatically generated][image3]**
# **![Workflow Diagram][image4]**

### **Workflow Analysis**

**High-Level Flow**
The user journey begins with **User Opens App** and proceeds through a **Registration/Login Flow** to access the **Home Screen**.

From there, the application splits into two parallel tracks:

**1. Daily Process**
*   **Trigger:** Daily Notification.
*   **Action:** User completes a "Check-In" interaction.
*   **Data:** Check-in data is stored.

**2. Weekly Process**
*   **Trigger:** Weekly Notification.
*   **Action:** User completes a "Structured Questionnaire".
*   **Data:** Questionnaire data is stored.

**Core Logic: Wellbeing Score**
A key business rule identified in the diagram is the formula for calculating the Wellbeing Score. It is a composite score derived from both data streams:

> **Score Calculation = (80% Structured Questionnaire) + (20% Daily Check-In)**

**Outputs & Engagement**
*   **Feedback:** The system provides weekly feedback to the user based on the calculated score.
*   **Explore Page:** Users can interact with the app to access content and daily affirmations throughout the process.

# **Key Workflow Steps (Version 1):** 

1. **User Login/Sign-Up:** Users log in or create an account.  
2. **Daily Notification:** Prompts users to complete their daily check-in.  
3. **Check-In Interaction:** Users answer questions about their emotional and social state.  
4. **Weekly Notification:** Reminds users to complete the structured questionnaire.  
5. **Structured Questionnaire:** Users answer detailed questions for the week.  
6. **Data Storage:** Check-in and questionnaire responses are stored.  
7. **Score Calculation:** Data is processed to calculate the weekly wellbeing score.  
8. **Feedback Display:** Users receive their wellbeing score and insights.  
9. **Explore Page:** Users access daily affirmations and wellbeing content.

# **8\. Non-Functional Requirements**

* **Security:** Compliance with GDPR, HIPAA, and other relevant regulations.  
* **Scalability:** Support for thousands of simultaneous interactions.  
* **Interoperability:** Seamless integration with wearable devices and third-party APIs.

# **9\. Risk Management**

## **Version 1 Risks:**

* **Risk:** Low user engagement with daily check-ins.  
  * **Mitigation:** Add gamified elements and reminders.

## **Version 2 Risks:**

* **Risk:** AI functionality delays.  
  * **Mitigation:** Begin foundational work during Version 1 development.
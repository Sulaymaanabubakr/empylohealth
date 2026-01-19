# Business Requirements Document 

# **Project Name: Circles Health App**

**Date:** 24/11/2024

**Version:** 4.0

**Prepared By:** Gracious Musariri

**Reviewed By:** Gracious Musariri

**1\. Executive Summary**

The Circles Health App helps users track and improve their mental, physical, and social health. The app offers simple tracking, daily check-ins, and a clear wellbeing score in its first release.

# **2\. Business Objectives**

## **Version 1 Objectives:**

- Build the first version of the app with simple tracking, scoring, and community support.
- Help users form a habit, connect with others, and receive useful feedback.

# **3\. Stakeholders**

## **Primary Stakeholders:**

- Product Management   
- Development Team  
- Marketing and Sales   
- Users

## **Key Users:**

- Individuals seeking to improve their wellbeing.  

# **4\. Functional Requirements (Version 1)**

1. **Secure Login:**  
   - Users can log in safely with email, password, and a code sent to their device.  
2. **Daily Check-Ins:**  
   - Two quick inputs: **Mood** (Emoji) and **Focus Level** (Slider). These contribute 20% to your wellbeing score.

**3. Weekly Wellness Survey:**  
- A detailed set of questions about your mind, body, and social life (80% of your score). Completed once a week for deeper insights.

**4. Explore Page:**  
- Daily positive messages, short health tips, and recommended activities.

**5. Wellbeing Score:**  
- A single score made from your Weekly Survey (80%) and Daily Check-ins (20%).

**6. Circles (Support Groups):**
- Users can join and view support groups (Circles) based on their interests.

**7. Chat:**
- Direct messaging and group chat functionality to connect with other users.

# **5\. Roadmap**

| Version | Key features | Target Timelines | Audience |
| :---- | :---- | :---- | :---- |
| Version 1 |  Structured data, daily check-ins, Explore page, Circles, Chat  | **Start: Month 1 End: Month 4**  | General users  |

# **6\. Wellbeing Score Calculation**

#### ***Version 1 Formula:***

Wellbeing Score (Version 1)=(0.8×Weekly Survey Score)+(0.2×Daily Check-In Average)

# **7\. Process and Data Flow Diagrams**



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

* **Security:** Keep user data safe and follow privacy laws (like GDPR and HIPAA).  
* **Ready for Growth:** Built to handle many users at once.  

# **9\. Risk Management**

## **Version 1 Risks:**

* **Risk:** People forgetting to check in.  
  * **Solution:** Make it fun and send helpful reminders.

---

# **10\. Future Implementation (Versions 2 & 3)**

This section outlines advanced features planned for future releases, including AI integration, organizational tools, and wearable connectivity.

## **Business Objectives (Future)**

### **Version 2 Objectives:**
- Introduce AI-driven features for personalized mental health coaching and organizational tools for wellbeing analytics.  
- Support admin-level functionality for organizational users.

### **Version 3 Objectives:**
- Provide predictive analytics for individual and organizational wellbeing trends.

## **Functional Requirements (Future)**

### **Version 2 (Second Release):**
1. **AI Mental Health Coach:**  
   - Conversational interface for personalized support and insights.  
2. **AI-Driven Insights:**  
   - Incorporate AI-analyzed conversation data into wellbeing scoring (30% weighting).
3. **Admin Interaction with AI (Web App):**  
   - Admins can query the AI for trends and recommendations.
4. **Graph Database:**  
   - Models relationships and provides advanced analytics for organizational users.

### **Version 3 (Enhanced Engagement):**
1. **Wearable Integration:**  
   - Sync data from devices like Fitbit and Apple Watch.
2. **Predictive Analytics:**  
   - AI-driven predictions for individual risk levels and team trends.

## **Roadmap (Future)**

| Version | Key features | Target Timelines | Audience |
| :---- | :---- | :---- | :---- |
| Version 2 | AI-driven features, admin tools, graph database  | **Start: Month 5** **End: Month 10**  | Users & organizations  |
| Version 3 | Wearable integration, predictive analytics  | **Start: Month 11** **End: Month 18**  | Users & large-scale organisations  |

### **Expanded Timeline: Version 2**
**Duration:** 6 months (Month 5 - Month 10)
- **Month 5-6:** Development of AI Features (AI Coach, NLP models).
- **Month 7:** Development of Admin Tools (Dashboard, AI queries).
- **Month 8:** Graph Database Implementation.
- **Month 9:** Beta Testing.
- **Month 10:** Final Refinements and Public Launch (Security/Compliance Audits).

### **Expanded Timeline: Version 3**
**Duration:** 8 months (Month 11 - Month 18)
- **Month 11-12:** Advanced Gamification.
- **Month 13-14:** Wearable Integration (Fitbit/Apple Watch APIs).
- **Month 15-16:** Predictive Analytics (AI models).
- **Month 17:** Large-Scale Testing (Scalability/Stress tests).
- **Month 18:** Final Refinements and Public Launch.

## **Wellbeing Score Calculation (Future)**

#### ***Version 2 Formula:***
Wellbeing Score (Version 2) = (0.5×Questionnaire Score)+(0.3×AI Conversation Score)+(0.2×Daily Check-In Average)

## **Non-Functional Requirements (Future)**
* **Interoperability:** Seamless integration with wearable devices and third-party APIs.

## **Risk Management (Future)**

### **Version 2 Risks:**
* **Risk:** AI functionality delays.  
  * **Mitigation:** Begin foundational work during Version 1 development.
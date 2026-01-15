# Logto Google Authentication Spec

## ADDED Requirements

### Requirement: Token Exchange
The system MUST allow users authenticated via Logto to access protected Backend resources.

#### Scenario: User signs in with Google via Logto
Given a user initiates login via Logto and selects Google
When they are redirected back to the application callback
Then the application MUST exchange the Logto identity for a valid Backend Access Token
And the browser MUST receive this token as a cookie named `access_token`
And the user SHOULD be redirected to the dashboard or intended page

#### Scenario: New Google User
Given a user signs in with Google for the first time
When the token exchange occurs
Then the Backend MUST create a new User record with the email and Logto ID
And the Backend MUST return a valid Access Token for this new user

#### Scenario: Existing Email User
Given a user registered with email/password "alice@example.com"
When they sign in with Google (using "alice@example.com")
Then the Backend MUST link the Logto ID to the existing User record
And the Backend MUST return a valid Access Token for "alice@example.com"

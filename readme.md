# Vacation Response App

## Libraries and Technologies Used

---

| Library    | Description                                                |
| ---------- | ---------------------------------------------------------- |
| ExpressJs  | Framework for making web apps                              |
| Mongoose   | Orm for mongodb. Mongodb is used to store user information |
| googleapis | Used for oauth and gmail api                               |

## Areas where code can be improved

---

- Encrypting tokens and user information in database.
- Storing information after every poll for fast computation.
- Using task queues for computation and apis.
- Using concurrency for fast execution
- Batch processing, instead of sending mails one user at a time, send bulk emails

## To Run

---

To install dependencies `yarn add`

To build `tsc`

To run `yarn start`

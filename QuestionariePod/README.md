This is the Questionarie microservice which will provide random questions to the students taking online exam.

prereq: nodejs to be installed on the machine

To run this service independently
	1. cd into ./QuestionariePod dir
 	2. npm ci

Usage of Microservice 

To create new questions:

Method : post
url : http://localhost:8080/questions
request body : {"question" : "What is value of PI?" }
result : 201 created


Method : get
url : http://localhost:8080/questions
result : random 3 question from the service


from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory, TestCase
from .models import User, Post
import json
from .views import edit, userId


class SimpleTest(TestCase):
	def setUp(self):
		# Every test needs access to the request factory.
		self.factory = RequestFactory()
		self.user = User.objects.create_user(
			username='anja', email='anja@anja.com', password='anja')
		self.user2 = User.objects.create_user(
			username='jani', email='jani@jani.com', password='jani')
		self.post = Post(body="My name is Anja", user=self.user)
		self.post.save()
		self.post_edited = { "body": "My name is Jani" }

	def test_unauthorised_post_edit(self):
		'''
		Authenticated user attempting to edit a post they do not own
		Force Error: 401 (Unauthorized)
		'''
		# Create an instance of a GET request.
		post_id = self.post.id
		data = json.dumps(self.post_edited)
		request = self.factory.put('/posts/' + str(post_id) + '/edit', data)
		request.user = self.user2

		# Recall that middleware are not supported. You can simulate a
		# logged-in user by setting request.user manually.
		# request.user = self.user

		# Or you can simulate an anonymous user by setting request.user to
		# an AnonymousUser instance.
		# request.user = AnonymousUser()

		# Test my_view() as if it were deployed at /customer/details
		response = edit(request, post_id)
		# Use this syntax for class-based views.
		# response = MyView.as_view()(request)
		self.assertEqual(response.status_code, 401)
		# self.assertEqual(post.body, "My name is Jani")
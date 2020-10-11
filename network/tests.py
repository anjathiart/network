from django.contrib.auth.models import AnonymousUser
from django.test import RequestFactory, TestCase
from .models import User, Post
import json
from .views import edit, current_user, user, posts, like, unlike

# SOME NOTES / INFO
'''
Recall that middleware are not supported. You can simulate a
logged-in user by setting request.user manually.
request.user = self.user

Or you can simulate an anonymous user by setting request.user to
an AnonymousUser instance.
request.user = AnonymousUser()

Test my_view() as if it were deployed at /customer/details
Use this syntax for class-based views.
response = MyView.as_view()(request)
'''

class SimpleTest(TestCase):
	def setUp(self):
		# Every test needs access to the request factory.
		self.factory = RequestFactory()
		self.active_user = User.objects.create_user(
			username='anja', email='anja@anja.com', password='anja')
		self.passive_user = User.objects.create_user(
			username='jani', email='jani@jani.com', password='jani')
		self.post = Post(body="My name is Anja", user=self.active_user)
		self.post.save()
		self.post_edited = { "body": "My name is Jani" }


	def test_unauthorised_post_edit(self):
		'''
		Authenticated user attempting to edit a post they do not own
		Force Error: 403 (Forbidden / no scope)
		'''
		post_id = self.post.id
		data = json.dumps(self.post_edited)
		request = self.factory.put('/posts/' + str(post_id) + '/edit', data)
		request.user = self.passive_user
		response = edit(request, post_id)
		self.assertEqual(response.status_code, 403)


	def test_follow_self(self):
		'''
		User must not be able to 'follow' themselves
		Force Error: 403 (Forbidden / no scope)
		'''
		request = self.factory.put('/user/' + str(self.active_user.id))
		request.user = self.active_user
		response = user(request, self.active_user.id)
		self.assertEqual(response.status_code, 403)


	def test_post_validation_empty(self):
		'''
		Request with missing post body
		Force Error: 400
		'''
		request = self.factory.post('/posts', content_type='application/json')
		request.user = self.active_user
		response = posts(request)
		self.assertEqual(response.status_code, 400)


	def test_post_validation_bad(self):
		'''
		Request with post body that is an empty string
		Force Error: 400
		'''
		request = self.factory.post('/posts', json.dumps({ "body": "" }), content_type='application/json')
		request.user = self.active_user
		response = posts(request)
		self.assertEqual(response.status_code, 400)


	def test_unauthenticatedUser_like(self):
		'''
		User that is not logged in can't like a post
		Force error: 401
		'''
		request = self.factory.put('/posts/' + str(self.post.id) + 'like')
		request.user = AnonymousUser()
		response = like(request, self.post.id)
		self.assertEqual(response.status_code, 401)


	def test_unauthenticatedUser_like(self):
		'''
		User that is not logged in can't unlike a post
		Force error: 401
		'''
		request = self.factory.put('/posts/' + str(self.post.id) + 'unlike')
		request.user = AnonymousUser()
		response = unlike(request, self.post.id)
		self.assertEqual(response.status_code, 401)






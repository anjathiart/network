
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API
    path("posts", views.posts, name="posts"),
    path("posts/add", views.post, name="post_add"),
    path("posts/followers", views.posts_followers, name="posts_followers"),
    path("profile/<int:user_id>", views.profile, name="profile"),
    path("like", views.like, name="like"),
    path("edit/<int:post_id>", views.edit, name="edit")
]

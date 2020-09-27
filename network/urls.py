
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),

    # API
    path("user/current", views.userId, name="current_user"),
    path("user/<int:user_id>", views.profile, name="profile"),
    path("user/<int:user_id>/follow", views.follow, name="follow"),
    path("posts/add", views.post, name="post_add"),
    path("posts", views.posts, name="post_add"),
    path("posts/follow", views.posts, name="posts"),
    path("posts/<int:post_id>/update", views.update, name="update"),
]

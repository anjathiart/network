# Generated by Django 3.1 on 2020-10-11 16:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('network', '0010_auto_20201011_1557'),
    ]

    operations = [
        migrations.AlterField(
            model_name='post',
            name='body',
            field=models.TextField(blank=True),
        ),
    ]
# Generated by Django 3.2.8 on 2023-08-11 04:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('warlock', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='player',
            name='openid',
            field=models.CharField(blank=True, default='', max_length=50, null=True),
        ),
    ]
